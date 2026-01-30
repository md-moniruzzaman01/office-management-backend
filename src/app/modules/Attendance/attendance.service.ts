/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Attendance,
  AttendanceLog,
  AttendanceStatus,
  Prisma,
} from '@prisma/client';
import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import ApiError from '../../../errors/ApiError';
import { sendEmail } from '../../../helpers/Email Service/email.service';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { getCurrentUser } from '../../../shared/getCurrentUser';
import prisma from '../../../shared/prisma';
import { userSearchableFields } from './attendance.constaints';
import {
  IAttendanceFilterRequest,
  UserWithAttendance,
} from './attendance.interface';
import { determineStatus, getDateWithTime } from './attendance.utilities';
import { LateAttendanceWarningTemplate } from './Email Templates/LateTemplate';

// Manual punch function (UTC-safe, user date preserved)
const insertIntoDBManually = async (
  data: {
    fingerId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    checkType: string; // "0"=CHECK_IN, "1"=CHECK_OUT
  } | null
): Promise<Attendance> => {
  if (!data || !data.fingerId || !data.date || !data.time)
    throw new ApiError(400, 'Invalid punch data');

  const fingerId = Number(data.fingerId);
  if (isNaN(fingerId)) throw new ApiError(400, 'fingerId invalid');

  // 🔹 Validate user and department
  const user = await prisma.userDetails.findUnique({
    where: { fingerId },
    select: {
      email: true,
      name: true,
      department: {
        select: {
          workingTimeStart: true,
          workingTimeEnd: true,
          weeklyWorkingDays: true,
        },
      },
    },
  });
  if (!user || !user.department)
    throw new ApiError(400, 'User or department not found');

  const [year, month, day] = data.date.split('-').map(Number);
  const [hour, minute] = data.time.split(':').map(Number);

  // 🕒 Punch time (Dhaka local)
  const punchTime = new Date(year, month - 1, day, hour, minute, 0);

  // 🗓️ Date only (Dhaka day normalization)
  const dateOnly = new Date(Date.UTC(year, month - 1, day));

  // 🔹 Time boundaries (to safely detect existing attendance)
  const startOfDayDhaka = new Date(dateOnly);
  startOfDayDhaka.setHours(0, 0, 0, 0);
  const endOfDayDhaka = new Date(dateOnly);
  endOfDayDhaka.setHours(23, 59, 59, 999);

  // 🕗 Department working hours
  const workingStart = getDateWithTime(
    user.department.workingTimeStart,
    data.date
  );
  const workingEnd = getDateWithTime(user.department.workingTimeEnd, data.date);

  const logType = data.checkType === '0' ? 'CHECK_IN' : 'CHECK_OUT';

  // 1️⃣ Find or create attendance safely
  let attendance = await prisma.attendance.findFirst({
    where: {
      fingerId,
      date: { gte: startOfDayDhaka, lte: endOfDayDhaka },
    },
    include: { logs: true },
  });

  if (!attendance) {
    attendance = await prisma.attendance.create({
      data: { fingerId, date: dateOnly, status: 'ON_TIME' },
      include: { logs: true },
    });
  }

  // 🔍 2️⃣ Prevent duplicate punch
  const lastLog = attendance.logs[attendance.logs.length - 1];

  if (lastLog?.type === 'CHECK_IN' && logType === 'CHECK_IN') {
    throw new ApiError(400, 'User already check-In');
  }

  if (lastLog?.type === 'CHECK_OUT' && logType === 'CHECK_OUT') {
    throw new ApiError(400, 'User already check-Out');
  }

  // 3️⃣ Add punch log
  await prisma.attendanceLog.create({
    data: {
      attendanceId: attendance.id,
      type: logType as any,
      time: punchTime,
    },
  });

  // 4️⃣ Re-fetch logs for accurate status
  const logs = await prisma.attendanceLog.findMany({
    where: { attendanceId: attendance.id },
    orderBy: { time: 'asc' },
  });

  const firstCheckIn = logs.find((l) => l.type === 'CHECK_IN')?.time || null;
  const lastCheckOut =
    [...logs].reverse().find((l) => l.type === 'CHECK_OUT')?.time || null;

  // 5️⃣ Determine new status
  const status = determineStatus({
    checkInTime: firstCheckIn,
    checkOutTime: lastCheckOut,
    workingStart,
    workingEnd,
  });

  // 6️⃣ Update attendance summary
  attendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: { status },
    include: { logs: true },
  });

  // 7️⃣ Late warning logic
  if (status === 'LATE' && user.email) {
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0));

    const lateCount = await prisma.attendance.count({
      where: {
        fingerId,
        status: 'LATE',
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    if (lateCount >= 3) {
      sendEmail(
        user.email,
        LateAttendanceWarningTemplate,
        '⚠️ Late Attendance Warning',
        { name: user.name || 'Employee', lateCount }
      );
    }
  }

  return attendance;
};

const insertIntoDB = async (
  data: { fingerId: string; checkType: string } | null
): Promise<Attendance | undefined> => {
  if (!data || !data.fingerId) {
    console.log('⚠️ Invalid or empty punch data');
    return;
  }

  const fingerId = Number(data.fingerId);
  if (isNaN(fingerId)) {
    console.log('⚠️ Invalid fingerId');
    return;
  }

  // 🔹 Validate user and department
  const user = await prisma.userDetails.findUnique({
    where: { fingerId },
    select: {
      id: true,
      name: true,
      email: true,
      department: {
        select: {
          workingTimeStart: true,
          workingTimeEnd: true,
          weeklyWorkingDays: true,
        },
      },
    },
  });
  if (!user || !user.department) return;

  // 🌏 Get current time in Dhaka
  const now = new Date();
  const nowDhaka = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
  );
  const punchTime = nowDhaka;

  // 🗓️ Normalize date for Dhaka (remove time part)
  const todayStr = nowDhaka.toISOString().split('T')[0];
  const dateOnlyDhaka = new Date(todayStr);

  // 🔹 Day boundaries for accurate lookup
  const startOfDayDhaka = new Date(dateOnlyDhaka);
  startOfDayDhaka.setHours(0, 0, 0, 0);
  const endOfDayDhaka = new Date(dateOnlyDhaka);
  endOfDayDhaka.setHours(23, 59, 59, 999);

  // 🕒 Department working times
  const workingStart = getDateWithTime(
    user.department.workingTimeStart,
    todayStr
  );
  const workingEnd = getDateWithTime(user.department.workingTimeEnd, todayStr);

  // ✅ Determine log type
  const logType = data.checkType === '0' ? 'CHECK_IN' : 'CHECK_OUT';

  // 1️⃣ Try to find today's attendance first
  let attendance = await prisma.attendance.findFirst({
    where: {
      fingerId,
      date: {
        gte: startOfDayDhaka,
        lte: endOfDayDhaka,
      },
    },
    include: { logs: true },
  });

  // 2️⃣ If not found, safely create new attendance
  if (!attendance) {
    attendance = await prisma.attendance.create({
      data: { fingerId, date: dateOnlyDhaka, status: 'ON_TIME' },
      include: { logs: true },
    });
  }

  // 🔍 3️⃣ Prevent duplicate punch
  const lastLog = attendance.logs[attendance.logs.length - 1];

  if (lastLog?.type === 'CHECK_IN' && logType === 'CHECK_IN') {
    return;
  }

  if (lastLog?.type === 'CHECK_OUT' && logType === 'CHECK_OUT') {
    return;
  }

  // 4️⃣ Add new punch log
  await prisma.attendanceLog.create({
    data: {
      attendanceId: attendance.id,
      type: logType as any,
      time: punchTime,
    },
  });

  // 5️⃣ Re-fetch logs to calculate status
  const logs = await prisma.attendanceLog.findMany({
    where: { attendanceId: attendance.id },
    orderBy: { time: 'asc' },
  });

  const firstCheckIn = logs.find((l) => l.type === 'CHECK_IN')?.time || null;
  const lastCheckOut =
    [...logs].reverse().find((l) => l.type === 'CHECK_OUT')?.time || null;

  // 6️⃣ Determine new status
  const status = determineStatus({
    checkInTime: firstCheckIn,
    checkOutTime: lastCheckOut,
    workingStart,
    workingEnd,
  });

  // 7️⃣ Update attendance summary
  attendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: { status },
    include: { logs: true },
  });

  // 8️⃣ Late warning if needed
  if (status === 'LATE' && user.email) {
    const monthStart = new Date(
      Date.UTC(dateOnlyDhaka.getFullYear(), dateOnlyDhaka.getMonth(), 1)
    );
    const monthEnd = new Date(
      Date.UTC(dateOnlyDhaka.getFullYear(), dateOnlyDhaka.getMonth() + 1, 0)
    );

    const lateCount = await prisma.attendance.count({
      where: {
        fingerId,
        status: 'LATE',
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    if (lateCount >= 3) {
      sendEmail(
        user.email,
        LateAttendanceWarningTemplate,
        '⚠️ Late Attendance Warning',
        {
          name: user.name || 'Employee',
          lateCount,
        }
      );
    }
  }

  console.log(
    `✅ ${logType} recorded for fingerId ${fingerId} at ${punchTime}`
  );
  return attendance;
};

const getAllFromDB = async (
  filters: IAttendanceFilterRequest,
  options: IPaginationOptions,
  req: Request
): Promise<IGenericResponse<Array<UserWithAttendance>>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const {
    searchTerm,
    month,
    departmentId,
    year,
    startDate,
    endDate,
    status,
    ...otherFilters
  } = filters;
  const userFilters: Prisma.UserDetailsWhereInput[] = [];
  const currentUser = await getCurrentUser(req);

  const userRole = currentUser?.user.role;
  if (userRole === ENUM_USER_ROLE.EMPLOYEE) {
    if (currentUser?.supervisedDepartment) {
      userFilters.push({
        departmentId: currentUser.supervisedDepartment?.id,
      });
    } else {
      userFilters.push({
        id: currentUser?.id,
      });
    }
  }

  // if (userRole === ENUM_USER_ROLE.HR) {
  //   if (currentUser?.department?.branch?.companyId) {
  //     userFilters.push({
  //       department: {
  //         branch: {
  //           companyId: currentUser.department.branch.companyId,
  //         },
  //       },
  //     });
  //   }
  // }

  if (userRole === ENUM_USER_ROLE.INCHARGE) {
    if (currentUser?.department?.branchId) {
      userFilters.push({
        department: {
          branchId: currentUser.department.branchId,
        },
      });
    }
  }

  if (userRole === ENUM_USER_ROLE.MANAGER) {
    if (currentUser?.department?.branch?.companyId) {
      userFilters.push({
        department: {
          branch: {
            companyId: currentUser.department.branch.companyId,
          },
        },
      });
    }
  }

  if (searchTerm) {
    userFilters.push({
      OR: userSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' },
      })),
    });
  }

  if (departmentId) {
    userFilters.push({ departmentId: parseInt(departmentId) });
  }

  userFilters.push({
    user: {
      role: {
        not: ENUM_USER_ROLE.SUPER_ADMIN,
      },
    },
  });

  if (Object.keys(otherFilters).length > 0) {
    userFilters.push({
      AND: Object.entries(otherFilters).map(([key, value]) => ({
        [key]: value,
      })),
    });
  }

  const userWhere: Prisma.UserDetailsWhereInput =
    userFilters.length > 0 ? { AND: userFilters } : {};

  const users = await prisma.userDetails.findMany({
    where: userWhere,
    skip,
    take: limit,
    orderBy: { createdAt: 'asc' },
    select: { name: true, department: true, id: true, fingerId: true },
  });

  const total = await prisma.userDetails.count({ where: userWhere });

  const now = new Date();
  const activeMonth = Number(month ?? now.getMonth() + 1);
  const activeYear = Number(year ?? now.getFullYear());

  const startDateFilter = startDate
    ? new Date(startDate)
    : new Date(activeYear, activeMonth - 1, 1);
  const endDateFilter = endDate
    ? new Date(endDate)
    : new Date(activeYear, activeMonth, 0);

  const userIds = users
    .map((user) => user.fingerId)
    .filter((id): id is number => id !== null && id !== undefined);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      fingerId: { in: userIds },
      date: { gte: startDateFilter, lte: endDateFilter },
      ...(status && { status: status as AttendanceStatus }),
    },
    include: { logs: true },
  });

  const calculateDetails = (logs: AttendanceLog[]) => {
    if (!logs || logs.length === 0) return null;

    const sorted = [...logs].sort(
      (a, b) => a.time.getTime() - b.time.getTime()
    );
    const sessions: { entry: string; exit: string; duration: string }[] = [];
    let lastCheckIn: Date | null = null;

    let outsideCount = 0;

    sorted.forEach((log) => {
      if (log.type === 'CHECK_IN') {
        // only count if previous check-in already has checkout
        if (!lastCheckIn) lastCheckIn = log.time;
      } else if (log.type === 'CHECK_OUT') {
        if (lastCheckIn) {
          const diff = log.time.getTime() - lastCheckIn.getTime();
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          sessions.push({
            entry: lastCheckIn.toISOString(),
            exit: log.time.toISOString(),
            duration: `${h}h ${m}m`,
          });
          lastCheckIn = null; // reset for next session
          outsideCount++;
        } else {
          // double checkout without check-in → last checkout overrides
          if (sessions.length > 0) {
            const lastSession = sessions[sessions.length - 1];
            lastSession.exit = log.time.toISOString();
            const diff =
              new Date(log.time).getTime() -
              new Date(lastSession.entry).getTime();
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            lastSession.duration = `${h}h ${m}m`;
            outsideCount++;
          }
        }
      }
    });

    // calculate total office time
    let totalOfficeTime: string | null = null;
    if (sessions.length > 0) {
      const totalMs = sessions.reduce(
        (acc, s) =>
          acc + (new Date(s.exit).getTime() - new Date(s.entry).getTime()),
        0
      );
      const hours = Math.floor(totalMs / (1000 * 60 * 60));
      const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      totalOfficeTime = `${hours}h ${minutes}m`;
    }

    const firstEntry = sessions.length > 0 ? sessions[0].entry : null;
    const lastExit =
      sessions.length > 0 ? sessions[sessions.length - 1].exit : null;

    return {
      entryTime: firstEntry,
      exitTime: lastExit,
      outsideCount,
      totalOfficeTime,
      sessions,
    };
  };

  const result: UserWithAttendance[] = users.map((user) => {
    const userAttendance = attendanceRecords
      .filter((att) => att.fingerId === user.fingerId)
      .map((att) => ({ ...att, details: calculateDetails(att.logs) }));

    return { ...user, attendance: userAttendance };
  });

  return { meta: { total, page, limit }, data: result };
};

const getByIdFromDB = async (id: number): Promise<Attendance | null> => {
  const result = await prisma.attendance.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Attendance>
): Promise<Attendance | null> => {
  const result = await prisma.attendance.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<Attendance> => {
  const result = await prisma.attendance.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};
const deleteAttendanceLogFromDB = async (
  id: string
): Promise<AttendanceLog> => {
  const result = await prisma.attendanceLog.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const downloadAttendanceFromDB = async (
  filters: { startDate?: string; endDate?: string },
  res: Response
) => {
  try {
    const where: any = {};
    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const attendanceData = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            employeeId: true,
            name: true,
            department: {
              select: {
                name: true,
                branch: {
                  select: {
                    name: true,
                    company: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        logs: { orderBy: { time: 'asc' } },
      },
      orderBy: { date: 'asc' },
    });

    if (!attendanceData.length) {
      return res.status(404).json({ message: 'No attendance data found' });
    }

    // ✅ All unique dates
    const allDates = Array.from(
      new Set(attendanceData.map((a) => a.date.toISOString().split('T')[0]))
    ).sort();

    // ✅ Group by employee
    const employees = new Map<
      string,
      {
        employeeId: string;
        name: string;
        company: string;
        branch: string;
        department: string;
        dates: Record<string, { status: string; text: string }>;
        statusSummary?: string;
      }
    >();

    for (const att of attendanceData) {
      const empKey = att.user?.employeeId || 'UNKNOWN';

      if (!employees.has(empKey)) {
        employees.set(empKey, {
          employeeId: att.user?.employeeId || '-',
          name: att.user?.name || '-',
          company: att.user?.department?.branch?.company?.name || '-',
          branch: att.user?.department?.branch?.name || '-',
          department: att.user?.department?.name || '-',
          dates: {},
        });
      }

      const checkInLogs = att.logs.filter((l) => l.type === 'CHECK_IN');
      const checkOutLogs = att.logs.filter((l) => l.type === 'CHECK_OUT');

      const firstCheckIn = checkInLogs[0]?.time
        ? new Date(checkInLogs[0].time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-';
      const lastCheckOut = checkOutLogs[checkOutLogs.length - 1]?.time
        ? new Date(checkOutLogs.at(-1)!.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-';

      // ✅ Correct total duration calculation (all check-ins/check-outs)
      let totalMs = 0;
      const pairs = Math.min(checkInLogs.length, checkOutLogs.length);
      for (let i = 0; i < pairs; i++) {
        totalMs +=
          new Date(checkOutLogs[i].time).getTime() -
          new Date(checkInLogs[i].time).getTime();
      }

      const hrs = Math.floor(totalMs / (1000 * 60 * 60));
      const mins = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      const durationStrFormatted = totalMs > 0 ? `(${hrs}h ${mins}m)` : '-';

      // ✅ Text format: check-in / check-out [STATUS] (duration)
      const dateKey = att.date.toISOString().split('T')[0];
      employees.get(empKey)!.dates[dateKey] = {
        status: att.status || 'ABSENT',
        text: `${firstCheckIn} / ${lastCheckOut} [${att.status || 'ABSENT'}] ${durationStrFormatted}`,
      };
    }

    // ✅ Calculate status summary for each employee
    for (const emp of employees.values()) {
      const statusCount: Record<string, number> = {};
      for (const date of allDates) {
        const status = emp.dates[date]?.status || 'ABSENT';
        statusCount[status] = (statusCount[status] || 0) + 1;
      }

      const summaryParts: string[] = [];
      for (const [status, count] of Object.entries(statusCount)) {
        if (count > 0) summaryParts.push(`${status}: ${count}`);
      }
      emp.statusSummary = summaryParts.join(', ');
    }

    // ✅ Create workbook & sheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');

    const baseHeaders = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Company', key: 'company', width: 20 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Status Summary', key: 'statusSummary', width: 35 },
    ];

    const dateHeaders = allDates.map((date) => ({
      header: date,
      key: date,
      width: 20,
    }));

    sheet.columns = [...baseHeaders, ...dateHeaders];

    const statusColors: Record<string, string> = {
      ON_TIME: 'FF228B22', // dark green
      LATE: 'FFDAA520', // goldenrod
      HALF_DAY: 'FFFF8C00', // dark orange
      ABSENT: 'FFB22222', // firebrick red
      LEAVE: 'FF1E90FF', // dodger blue
      ROASTER: 'FF556B2F', // dark olive green
    };

    // ✅ Fill rows
    for (const emp of employees.values()) {
      const rowValues: any = {
        employeeId: emp.employeeId,
        name: emp.name,
        company: emp.company,
        branch: emp.branch,
        department: emp.department,
        statusSummary: emp.statusSummary,
      };

      for (const date of allDates) {
        const data = emp.dates[date];
        rowValues[date] = data ? data.text : 'ABSENT';
      }

      const row = sheet.addRow(rowValues);

      // Apply richText coloring for [STATUS] only
      for (const date of allDates) {
        const colIndex = baseHeaders.length + allDates.indexOf(date) + 1;
        const cell = row.getCell(colIndex);
        const data = emp.dates[date];
        const text = data?.text || '-';

        // Regex split: before [STATUS], [STATUS], after
        const match = text.match(/^(.*)\[(.*)\](.*)$/);
        if (match) {
          const [, before, statusInBrackets, after] = match;
          cell.value = {
            richText: [
              { text: before, font: { color: { argb: 'FF000000' } } },
              {
                text: `[${statusInBrackets}]`,
                font: {
                  color: { argb: statusColors[statusInBrackets] || 'FF000000' },
                  bold: true,
                },
              },
              { text: after, font: { color: { argb: 'FF000000' } } },
            ],
          };
        } else {
          cell.value = text;
        }
        cell.alignment = { wrapText: true, vertical: 'top' };
      }
    }

    // Header styling
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // ✅ Send Excel response
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=attendance.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel download error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const AttendanceService = {
  insertIntoDB,
  insertIntoDBManually,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
  deleteAttendanceLogFromDB,
  downloadAttendanceFromDB,
};
