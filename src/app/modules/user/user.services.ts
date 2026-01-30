/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Review, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import config from '../../../config';
import { ENUM_USER_ROLE, ENUM_USER_STATUS } from '../../../enum/user';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { getCurrentUser } from '../../../shared/getCurrentUser';
import prisma from '../../../shared/prisma';
import {
  generateVerificationCode,
  sendVerificationEmail,
  storeVerificationCode,
} from '../auth/auth.emailverify';
import { UserDetails } from './../../../../node_modules/.prisma/client/index.d';
import { userSearchableFields } from './user.constaints';
import {
  CreateReviewInput,
  CreateUserInput,
  IReviewFilterRequest,
  IUserFilterRequest,
  ReviewWithReviewer,
} from './user.interface';
dayjs.extend(customParseFormat);

const insertIntoDB = async (
  data: CreateUserInput,
  role: ENUM_USER_ROLE
): Promise<User> => {
  const hashedPassword = await bcrypt.hash(
    data.password,
    Number(config.bycrypt_salt_rounds)
  );

  const [isEmailExist, isEmployeeIDExist, isFingerIdExist, isNumberExist] =
    await Promise.all([
      prisma.user.findUnique({
        where: { email: data.email },
      }),
      prisma.userDetails.findUnique({
        where: { employeeId: data.employeeId },
      }),
      data.fingerId
        ? prisma.userDetails.findUnique({
            where: { fingerId: data.fingerId },
          })
        : null,
      prisma.userDetails.findFirst({
        where: { contactNo: data.contactNo },
      }),
    ]);

  // Error handling
  if (isEmailExist)
    throw new ApiError(409, 'User with this email already exists');
  if (isEmployeeIDExist)
    throw new ApiError(409, 'User with this employee ID already exists');
  if (isFingerIdExist)
    throw new ApiError(409, 'User with this finger ID already exists');
  if (isNumberExist)
    throw new ApiError(409, 'User with this contact number already exists');

  const verificationCode = generateVerificationCode();
  storeVerificationCode(data?.email, verificationCode);
  await sendVerificationEmail(data?.email, verificationCode);

  const result = await prisma.user.create({
    data: {
      email: data.email,
      role: role,
      password: hashedPassword,
      details: {
        create: {
          name: data.name,
          email: data.email,
          contactNo: data.contactNo,
          fingerId: data.fingerId,
          designation: data.designation,
          profileImage: data.profileImage,
          departmentId: data.departmentId,
          bloodGroup: data.bloodGroup,
          skills: data.skills,
          gender: data.gender,
          address: data.address,
          employeeId: data.employeeId,
          joiningDate: data.joiningDate,
          // dateOfBirth: data.dateOfBirth,
          nidImage: data.nidImage,
          roasters: data.roasters,
          cvImages: Array.isArray(data.cvImages)
            ? data.cvImages
            : data.cvImages
              ? [data.cvImages]
              : undefined,
          powers: {
            connect: data.powerId.map((id) => ({ id })),
          },
        },
      },
    },
    include: {
      details: true,
    },
  });

  return result;
};
export const insertReviewIntoDB = async (
  data: CreateReviewInput,
  req: Request
) => {
  const user = req.user;
  if (!user?.id) {
    throw new ApiError(401, 'Unauthorized');
  }
  const reviewer = await prisma.userDetails.findUnique({
    where: { userId: Number(user?.id) },
  });
  if (!reviewer) {
    throw new ApiError(404, 'Reviewer not found');
  }

  const reviewee = await prisma.userDetails.findUnique({
    where: { userId: data.revieweeId },
  });
  if (!reviewee) {
    throw new ApiError(404, 'Reviewee not found');
  }

  if (data.reviewerId === user?.id) {
    throw new ApiError(400, 'You cannot review yourself');
  }

  const result = await prisma.review.create({
    data: {
      message: data.message,
      rating: data.rating,
      reviewer: { connect: { id: user.id } },
      reviewee: { connect: { id: data.revieweeId } },
    },
  });

  return result;
};

const getAllFromDB = async (
  filters: IUserFilterRequest,
  options: IPaginationOptions,
  req: Request
): Promise<IGenericResponse<UserDetails[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, departmentId, role } = filters;
  const andConditions = [];

  const user = req.user?.role;

  // Search term filter (case-insensitive search on multiple fields)
  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (
    departmentId &&
    user !== ENUM_USER_ROLE.HR &&
    user !== ENUM_USER_ROLE.SUPER_ADMIN &&
    user !== ENUM_USER_ROLE.ADMIN &&
    user !== ENUM_USER_ROLE.INCHARGE &&
    user !== ENUM_USER_ROLE.MANAGER
  ) {
    andConditions.push({
      departmentId: parseInt(departmentId),
    });
  }

  if (role) {
    andConditions.push({
      user: {
        role: role,
      },
    });
  }

  andConditions.push({
    user: {
      role: {
        not: ENUM_USER_ROLE.SUPER_ADMIN,
      },
    },
  });

  const whereConditions: Prisma.UserDetailsWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.userDetails.findMany({
    where: whereConditions,
    include: {
      powers: true,
      department: {
        select: {
          id: true,
          name: true,
          supervisor: {
            select: {
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,

              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
    skip,
    take: limit,
  });
  const total = await prisma.userDetails.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getMyTeamFromDB = async (
  filters: IUserFilterRequest,
  options: IPaginationOptions,
  req: Request
): Promise<IGenericResponse<UserDetails[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;
  const andConditions: Prisma.UserDetailsWhereInput[] = [];

  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    throw new ApiError(401, 'User not authenticated');
  }

  const userRole = currentUser?.user.role;

  if (userRole === ENUM_USER_ROLE.EMPLOYEE) {
    if (currentUser) {
      andConditions.push({
        departmentId: currentUser.department?.id,
      });
    }
  }

  if (userRole === ENUM_USER_ROLE.INCHARGE) {
    if (currentUser?.department?.branchId) {
      andConditions.push({
        department: {
          branchId: currentUser.department.branchId,
        },
      });
    }
  }

  if (userRole === ENUM_USER_ROLE.MANAGER) {
    if (currentUser?.department?.id) {
      andConditions.push({
        department: {
          branch: {
            companyId: currentUser.department?.branch?.companyId,
          },
        },
      });
    }
  }

  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }
  // 🔒 Always hide SUPER_ADMIN users
  andConditions.push({
    user: {
      role: {
        not: ENUM_USER_ROLE.SUPER_ADMIN,
      },
    },
  });

  const whereConditions: Prisma.UserDetailsWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.userDetails.findMany({
    where: whereConditions,
    include: {
      powers: true,
      department: {
        select: {
          id: true,
          name: true,
          supervisor: { select: { name: true } },
          branch: {
            select: {
              id: true,
              name: true,
              company: { select: { id: true, name: true } },
            },
          },
        },
      },
      user: { select: { id: true, role: true } },
    },
    skip,
    take: limit,
  });

  const total = await prisma.userDetails.count({
    where: whereConditions,
  });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getMyReceivedReviewFromDB = async (
  filters: IReviewFilterRequest,
  options: IPaginationOptions,
  id: number
): Promise<IGenericResponse<ReviewWithReviewer[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;
  const andConditions: Prisma.ReviewWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (id) {
    andConditions.push({
      revieweeId: id,
    });
  }

  const whereConditions: Prisma.ReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // === Query
  const result = await prisma.review.findMany({
    where: whereConditions,
    select: {
      id: true,
      message: true,
      rating: true,
      createdAt: true,
      reviewer: {
        select: {
          name: true,
          profileImage: true,
          department: {
            select: {
              name: true,
              branch: {
                select: {
                  name: true,
                  company: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.review.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getByIdFromDB = async (userId: number) => {
  const result = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      email: true,
      role: true,
      details: {
        select: {
          attendances: {
            orderBy: { createdAt: 'asc' },
            include: {
              logs: true,
            },
          },
          roasters: true,
          name: true,
          fingerId: true,
          email: true,
          bloodGroup: true,
          address: true,
          skills: true,
          joiningDate: true,
          status: true,
          dateOfBirth: true,
          terminationDate: true,

          leaves: {
            where: { status: 'APPROVED' },
          },
          gender: true,
          employeeId: true,
          resignationDate: true,
          exitType: true,
          exitReason: true,
          lastWorkingDay: true,
          powers: {
            select: { name: true, id: true },
          },
          verified: true,
          contactNo: true,
          designation: true,
          profileImage: true,
          nidImage: true,
          cvImages: true,
          requisitionsRequested: {
            include: {
              createdBy: {
                select: {
                  name: true,
                  department: { select: { name: true } },
                },
              },
              items: true,
              branch: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
          department: {
            select: {
              name: true,
              id: true,
              workingTimeEnd: true,
              workingTimeStart: true,
              weeklyWorkingDays: true,
              supervisor: { select: { name: true, gender: true } },
              yearlyLeaveCount: true,
              _count: { select: { users: true } },
              branch: {
                select: {
                  name: true,
                  company: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) return null;

  const attendances = result.details?.attendances || [];
  const today = dayjs();
  const startOfMonth = today.startOf('month');
  const department = result.details?.department;

  // ✅ helper to extract first checkIn and last checkOut from logs
  const getCheckInOut = (a: any) => {
    const checkIn =
      a.logs.find((l: any) => l.type === 'CHECK_IN')?.time || null;
    const checkOut =
      [...a.logs].reverse().find((l: any) => l.type === 'CHECK_OUT')?.time ||
      null;
    return { checkIn, checkOut };
  };

  const calcDuration = (a: any) => {
    const { checkIn, checkOut } = getCheckInOut(a);
    if (!checkIn || !checkOut) return 0;
    const startDt = dayjs(checkIn);
    const endDt = dayjs(checkOut);
    return endDt.isBefore(startDt)
      ? endDt.add(1, 'day').diff(startDt, 'minute') / 60
      : endDt.diff(startDt, 'minute') / 60;
  };

  const sumDurations = (records: typeof attendances) =>
    records.reduce((sum, a) => sum + calcDuration(a), 0);

  const isSameDay = (a: Date, b: Date | any) => dayjs(a).isSame(b, 'day');

  const todayAttendances = attendances.filter((a) => isSameDay(a.date, today));
  const weekAttendances = attendances.filter((a) =>
    dayjs(a.date).isSame(today, 'week')
  );
  const monthAttendances = attendances.filter((a) =>
    dayjs(a.date).isSame(today, 'month')
  );

  const todayHours = sumDurations(todayAttendances);
  const weeklyHours = sumDurations(weekAttendances);
  const monthlyHours = sumDurations(monthAttendances);

  const todayCheckIn = todayAttendances.at(0)
    ? getCheckInOut(todayAttendances.at(0)!).checkIn
      ? dayjs(getCheckInOut(todayAttendances.at(0)!).checkIn).format('HH:mm:ss')
      : null
    : null;

  const todayCheckOut =
    todayAttendances.length > 0
      ? getCheckInOut(todayAttendances[todayAttendances.length - 1]).checkOut
        ? dayjs(
            getCheckInOut(todayAttendances[todayAttendances.length - 1])
              .checkOut
          ).format('HH:mm:ss')
        : null
      : null;

  const mapWeekday = (day: string) =>
    day.charAt(0) + day.slice(1).toLowerCase(); // "SUNDAY" -> "Sunday"

  const workingDays = department?.weeklyWorkingDays?.length
    ? department.weeklyWorkingDays.map(mapWeekday)
    : [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ];

  const workingDaysInMonth: string[] = [];
  let cursor = startOfMonth.clone();
  while (cursor.isSameOrBefore(today)) {
    if (workingDays.includes(cursor.format('dddd'))) {
      workingDaysInMonth.push(cursor.format('YYYY-MM-DD'));
    }
    cursor = cursor.add(1, 'day');
  }

  const filteredMonthAttendances = monthAttendances.filter(
    (a) => a.logs.length > 0
  );

  const attendedDaysSet = new Set(
    filteredMonthAttendances.map((a) => dayjs(a.date).format('YYYY-MM-DD'))
  );

  const absentDays = workingDaysInMonth.filter(
    (day) => !attendedDaysSet.has(day)
  );

  const presentDays = workingDaysInMonth.length - absentDays.length;

  const lateCount = filteredMonthAttendances.filter((a) => {
    const { checkIn } = getCheckInOut(a);
    if (!checkIn) return false;

    const workingTime = department?.workingTimeStart ?? '00:00';

    const parsedStart = dayjs(workingTime, ['HH:mm', 'h:mm A', 'h A'], true);

    if (!parsedStart.isValid()) {
      console.log('❌ Invalid workingTimeStart:', workingTime);
      return false;
    }

    const scheduled = dayjs(a.date)
      .hour(parsedStart.hour())
      .minute(parsedStart.minute())
      .second(0);

    const checkInTime = dayjs(checkIn);

    return checkInTime.isAfter(scheduled);
  }).length;

  const avgCheckIn = () => {
    const validTimes = filteredMonthAttendances
      .map((a) => getCheckInOut(a).checkIn)
      .filter(Boolean) as Date[];
    if (!validTimes.length) return null;
    const totalMinutes = validTimes.reduce(
      (sum, t) => sum + dayjs(t).hour() * 60 + dayjs(t).minute(),
      0
    );
    const avg = totalMinutes / validTimes.length;
    const h = Math.floor(avg / 60);
    const m = Math.floor(avg % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  let streak = 0;
  for (let i = workingDaysInMonth.length - 1; i >= 0; i--) {
    const date = workingDaysInMonth[i];
    if (attendedDaysSet.has(date)) streak++;
    else break;
  }

  const explicitAbsentDays = attendances
    .filter((a) => a.status === 'ABSENT')
    .map((a) => dayjs(a.date).format('YYYY-MM-DD'))
    .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());
  const lastAbsent =
    explicitAbsentDays.length > 0 ? explicitAbsentDays[0] : null;

  const recentActivity = attendances
    .slice() // copy
    .reverse()
    .slice(0, 6)
    .map((a) => {
      const { checkIn, checkOut } = getCheckInOut(a);
      return {
        date: dayjs(a.date).format('YYYY-MM-DD'),
        checkIn: checkIn ? dayjs(checkIn).format('HH:mm:ss') : null,
        checkOut: checkOut ? dayjs(checkOut).format('HH:mm:ss') : null,
        duration: calcDuration(a).toFixed(2),
        status: a.status,
      };
    });

  const weeklyDays = new Set(
    weekAttendances
      .filter((a) => a.logs.length > 0)
      .map((a) => dayjs(a.date).format('YYYY-MM-DD'))
  ).size;
  const monthlyWorkDays = new Set(
    monthAttendances
      .filter((a) => a.logs.length > 0)
      .map((a) => dayjs(a.date).format('YYYY-MM-DD'))
  ).size;

  const workingTimeStart = department?.workingTimeStart ?? '00:00';
  const workingTimeEnd = department?.workingTimeEnd ?? '00:00';
  const start = dayjs(workingTimeStart, 'hh:mm A');
  const end = dayjs(workingTimeEnd, 'hh:mm A');

  // total hours difference
  const workingHours = end.diff(start, 'hour', true);
  const totalWorkingTimeThisMonth = workingHours * monthlyWorkDays;

  const monthlyDays = attendedDaysSet.size;
  const weeklyAvgHours = weeklyDays ? weeklyHours / weeklyDays : 0;
  const monthlyAvgHours = monthlyDays ? monthlyHours / monthlyDays : 0;
  const overTimeHours = Math.max(0, monthlyHours - totalWorkingTimeThisMonth);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = daysOfWeek.map((day) => {
    const hours = weekAttendances
      .filter((a) => dayjs(a.date).format('ddd') === day)
      .reduce((sum, a) => sum + calcDuration(a), 0);
    return { name: day, hours: parseFloat(hours.toFixed(2)) };
  });

  const weeksMap: Record<string, number> = {};
  filteredMonthAttendances.forEach((a) => {
    const week = Math.ceil(dayjs(a.date).date() / 7);
    const key = `Week ${week}`;
    const dur = calcDuration(a);
    weeksMap[key] = (weeksMap[key] || 0) + dur;
  });

  const monthlyData = Array.from({ length: 5 }).map((_, i) => {
    const name = `Week ${i + 1}`;
    return { name, hours: parseFloat((weeksMap[name] || 0).toFixed(2)) };
  });

  const yearlyMap: Record<string, number> = {};
  attendances.forEach((a) => {
    const m = dayjs(a.date).format('MMM');
    const dur = calcDuration(a);
    yearlyMap[m] = (yearlyMap[m] || 0) + dur;
  });

  const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const yearlyData = monthLabels.map((month) => ({
    name: month,
    hours: parseFloat((yearlyMap[month] || 0).toFixed(2)),
  }));

  return {
    ...result,
    attendance: {
      todayHours: todayHours.toFixed(2),
      todayCheckIn,
      todayCheckOut,
      weeklyHours: weeklyHours.toFixed(2),
      monthlyHours: monthlyHours.toFixed(2),
      overTimeHours: overTimeHours.toFixed(2),
      weeklyAvgHours: weeklyAvgHours.toFixed(2),
      monthlyAvgHours: monthlyAvgHours.toFixed(2),
      weeklyData,
      monthlyData,
      yearlyData,
      absentDays: absentDays.length,
      lateCount,
      avgCheckIn: avgCheckIn(),
      streak,
      lastAbsent,
      recentActivity,
      daysInMonth: workingDaysInMonth.length,
      presentDays,
    },
  };
};

export const getByIdForDownloadFromDB = async (
  userId: number,
  filters: { startDate?: string; endDate?: string },
  res: Response
) => {
  try {
    const { startDate, endDate } = filters;
    const dateRange =
      startDate && endDate
        ? { gte: new Date(startDate), lte: new Date(endDate) }
        : undefined;

    const data = await prisma.userDetails.findUnique({
      where: { id: userId },
      include: {
        user: { select: { email: true, role: true } },
        department: {
          select: {
            name: true,
            _count: true,
            workingTimeStart: true,
            workingTimeEnd: true,
            weeklyWorkingDays: true,
            supervisor: { select: { name: true } },
          },
        },
        powers: { select: { name: true } },
        requisitionsRequested: {
          where: { status: 'APPROVED', createdAt: dateRange },
          select: { title: true, status: true, createdAt: true },
        },
        leaves: {
          where: { status: 'APPROVED', startDate: dateRange },
          select: { startDate: true, endDate: true, leaveDays: true },
        },
        attendances: {
          where: { date: dateRange },
          include: { logs: true },
        },
      },
    });

    if (!data) return res.status(404).json({ message: 'User not found' });

    // ===== Helper Functions (inside main function) =====
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const formatTime = (date: Date) => date.toTimeString().split(' ')[0];

    const getHoursBetween = (start: Date, end: Date) => {
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return { hours, minutes, totalHours: diffMs / (1000 * 60 * 60) };
    };

    const generateAttendanceSummary = (attendances: any[]) => {
      const weeklyMap: Record<string, number> = {};
      const monthlyMap: Record<string, number> = {};
      const yearlyMap: Record<string, number> = {};

      attendances.forEach((att) => {
        const sortedLogs = att.logs.sort(
          (a: any, b: any) => a.time.getTime() - b.time.getTime()
        );
        let totalHoursForDay = 0;

        for (let i = 0; i < sortedLogs.length; i += 2) {
          const checkIn = sortedLogs[i];
          const checkOut = sortedLogs[i + 1];
          if (checkIn && checkOut)
            totalHoursForDay += getHoursBetween(
              checkIn.time,
              checkOut.time
            ).totalHours;
        }

        // Weekly key YYYY-WW
        const weekNum = Math.ceil(
          ((att.date.getTime() -
            new Date(att.date.getFullYear(), 0, 1).getTime()) /
            (1000 * 60 * 60 * 24) +
            new Date(att.date.getFullYear(), 0, 1).getDay() +
            1) /
            7
        );
        const weekKey = `${att.date.getFullYear()}-W${weekNum}`;
        weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + totalHoursForDay;

        // Monthly key YYYY-MM
        const monthKey = `${att.date.getFullYear()}-${(att.date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + totalHoursForDay;

        // Yearly key YYYY
        const yearKey = `${att.date.getFullYear()}`;
        yearlyMap[yearKey] = (yearlyMap[yearKey] || 0) + totalHoursForDay;
      });

      const mapToArray = (map: Record<string, number>, keyName: string) =>
        Object.entries(map).map(([key, value]) => ({
          [keyName]: key,
          hours: value.toFixed(2),
        }));

      return {
        weeklyData: mapToArray(weeklyMap, 'day'),
        monthlyData: mapToArray(monthlyMap, 'week'),
        yearlyData: mapToArray(yearlyMap, 'month'),
      };
    };
    // ===== End of Helpers =====

    const summaryData = generateAttendanceSummary(data.attendances);

    const workbook = new ExcelJS.Workbook();

    // ===== User Overview =====
    const sheet = workbook.addWorksheet('User Overview');
    sheet.columns = [
      { header: 'Field', key: 'field', width: 25 },
      { header: 'Value', key: 'value', width: 50 },
    ];
    sheet.addRows([
      { field: 'Name', value: data.name },
      { field: 'Email', value: data.email },
      { field: 'Employee ID', value: data.employeeId },
      { field: 'Designation', value: data.designation },
      { field: 'Department', value: data.department?.name },
      { field: 'Department Size', value: data.department?._count?.users },
      { field: 'Supervisor', value: data.department?.supervisor?.name || '—' },
      { field: 'Contact No', value: data.contactNo },
      { field: 'Blood Group', value: data.bloodGroup },
      { field: 'Verified', value: data.verified ? 'Yes' : 'No' },
      { field: 'Joining Date', value: formatDate(data.joiningDate) },
      { field: 'Status', value: data.status },
      { field: 'Powers', value: data.powers.map((p) => p.name).join(', ') },
    ]);

    // ===== Requisitions =====
    const reqSheet = workbook.addWorksheet('Requisitions');
    reqSheet.columns = [
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Date', key: 'date', width: 20 },
    ];
    data.requisitionsRequested.forEach((r) => {
      reqSheet.addRow({
        title: r.title,
        status: r.status,
        date: formatDate(r.createdAt),
      });
    });

    // ===== Leaves =====
    const leaveSheet = workbook.addWorksheet('Leaves');
    leaveSheet.columns = [
      { header: 'Start Date', key: 'start', width: 15 },
      { header: 'End Date', key: 'end', width: 15 },
      { header: 'Days', key: 'days', width: 10 },
    ];
    data.leaves.forEach((l) => {
      leaveSheet.addRow({
        start: formatDate(l.startDate),
        end: formatDate(l.endDate),
        days: l.leaveDays,
      });
    });

    // ===== Attendance Logs =====
    const logSheet = workbook.addWorksheet('Attendance Logs');
    logSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Check-in', key: 'in', width: 15 },
      { header: 'Check-out', key: 'out', width: 15 },
      { header: 'Duration', key: 'duration', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    data.attendances.forEach((att) => {
      const sortedLogs = att.logs.sort(
        (a, b) => a.time.getTime() - b.time.getTime()
      );
      for (let i = 0; i < sortedLogs.length; i += 2) {
        const checkIn = sortedLogs[i];
        const checkOut = sortedLogs[i + 1];
        let durationStr = '0h 0m';
        if (checkIn && checkOut) {
          const { hours, minutes } = getHoursBetween(
            checkIn.time,
            checkOut.time
          );
          durationStr = `${hours}h ${minutes}m`;
        }
        logSheet.addRow({
          date: formatDate(att.date),
          in: checkIn ? formatTime(checkIn.time) : '—',
          out: checkOut ? formatTime(checkOut.time) : '—',
          duration: durationStr,
          status: checkIn?.type || '—',
        });
      }
    });

    // ===== Attendance Summary Sheets =====
    const weeklySheet = workbook.addWorksheet('Weekly Breakdown');
    weeklySheet.columns = [
      { header: 'Day', key: 'day', width: 15 },
      { header: 'Hours Worked', key: 'hours', width: 15 },
    ];
    weeklySheet.addRows(summaryData.weeklyData);

    const monthlySheet = workbook.addWorksheet('Monthly Breakdown');
    monthlySheet.columns = [
      { header: 'Week', key: 'week', width: 15 },
      { header: 'Hours Worked', key: 'hours', width: 15 },
    ];
    monthlySheet.addRows(summaryData.monthlyData);

    const yearlySheet = workbook.addWorksheet('Yearly Breakdown');
    yearlySheet.columns = [
      { header: 'Month', key: 'month', width: 15 },
      { header: 'Hours Worked', key: 'hours', width: 15 },
    ];
    yearlySheet.addRows(summaryData.yearlyData);

    // ===== Send Excel =====
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=user_${data.id}_report.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel Download Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateOneInDB = async (
  id: string,
  payload: Partial<UserDetails | User> & {
    powers?: number[];
    role?: ENUM_USER_ROLE;
    departmentId?: number | null;
    status?: 'ACTIVATE' | 'DEACTIVATE';
    cvImages?: string[];
  }
): Promise<UserDetails> => {
  const {
    powers,
    role,
    departmentId,
    email,
    status,
    cvImages,
    ...restPayload
  } = payload;

  const userId = parseInt(id);

  const existingUser = await prisma.userDetails.findUnique({
    where: { userId: userId },
    include: { department: true },
  });

  const pl: any = payload;

  const [isEmailExist, isEmployeeIDExist, isFingerIdExist, isNumberExist] =
    await Promise.all([
      pl?.email
        ? prisma.user.findFirst({
            where: { email: pl.email, id: { not: userId } },
          })
        : null,
      pl?.employeeId
        ? prisma.userDetails.findFirst({
            where: { employeeId: pl.employeeId, userId: { not: userId } },
          })
        : null,
      pl?.fingerId
        ? prisma.userDetails.findFirst({
            where: { fingerId: pl.fingerId, userId: { not: userId } },
          })
        : null,
      pl?.contactNo
        ? prisma.userDetails.findFirst({
            where: { contactNo: pl.contactNo, userId: { not: userId } },
          })
        : null,
    ]);

  // Error handling
  if (isEmailExist)
    throw new ApiError(409, 'User with this email already exists');
  if (isEmployeeIDExist)
    throw new ApiError(409, 'User with this employee ID already exists');
  if (isFingerIdExist)
    throw new ApiError(409, 'User with this finger ID already exists');
  if (isNumberExist)
    throw new ApiError(409, 'User with this contact number already exists');

  if (status === ENUM_USER_STATUS.ACTIVATE) {
    await prisma.userDetails.update({
      where: { userId: userId },
      data: {
        terminationDate: null,
        resignationDate: null,
        exitReason: null,
        exitType: null,
        lastWorkingDay: null,
      },
    });
  }

  if (status) {
    (restPayload as any).status = status;
  }

  // If supervisor and department changed, release previous supervisor
  if (
    departmentId !== undefined &&
    existingUser?.departmentId &&
    existingUser.department?.supervisorId === userId &&
    existingUser.departmentId !== departmentId
  ) {
    await prisma.department.update({
      where: { id: existingUser.departmentId },
      data: { supervisorId: null },
    });
  }

  // Update user if role or email is present
  if (role || email) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(email && { email }),
      },
    });
  }

  // Determine departmentId to update if provided
  let departmentUpdate: { departmentId?: { set: number | null } } = {};

  if (departmentId !== undefined) {
    let finalDepartmentId: number | null = departmentId;

    if (departmentId) {
      const targetDepartment = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { branchId: true },
      });

      if (!targetDepartment) {
        finalDepartmentId = null;
      }
    }

    departmentUpdate = {
      departmentId: { set: finalDepartmentId },
    };
  }

  const dataToUpdate: any = {
    ...restPayload,
    ...(email && { email }),
    ...(status && { status }),
    ...(cvImages && { cvImages }),
    // department update
    ...(departmentId !== undefined
      ? departmentId !== null
        ? { department: { connect: { id: departmentId } } }
        : { department: { disconnect: true } }
      : {}),

    // powers update
    ...(powers && {
      powers: {
        set: powers.map((id) => ({ id })),
      },
    }),
  };

  const result = await prisma.userDetails.update({
    where: { userId: userId },
    data: dataToUpdate,
    include: {
      powers: true,
      department: true,
      user: true,
    },
  });

  return result;
};

const deleteByIdFromDB = async (id: string): Promise<UserDetails | null> => {
  const userId = parseInt(id);

  try {
    const result = await prisma.$transaction(async (prisma) => {
      const deleteUserDetails = await prisma.userDetails.delete({
        where: {
          userId: userId,
        },
      });

      await prisma.chatRoom.deleteMany({
        where: {
          OR: [
            { user1Id: deleteUserDetails.userId },
            { user2Id: deleteUserDetails.userId },
          ],
        },
      });

      await prisma.user.delete({
        where: {
          id: deleteUserDetails.userId,
        },
      });

      const verificationCode = await prisma.verificationCode.findUnique({
        where: { email: deleteUserDetails?.email },
      });

      if (verificationCode) {
        await prisma.verificationCode.delete({
          where: { email: deleteUserDetails?.email },
        });
      }

      // Delete other related data if they exist
      if (
        deleteUserDetails.fingerId !== null &&
        deleteUserDetails.fingerId !== undefined
      ) {
        await prisma.attendance.deleteMany({
          where: { fingerId: deleteUserDetails.fingerId },
        });
      }

      await prisma.leave.deleteMany({
        where: { userId: deleteUserDetails?.userId },
      });

      await prisma.activity.deleteMany({
        where: { userId: deleteUserDetails?.userId },
      });

      return deleteUserDetails;
    });

    return result;
  } catch (error) {
    throw new ApiError(500, (error as Error).message);
  }
};
const deleteReviewByIdFromDB = async (id: string): Promise<Review | null> => {
  const reviewId = parseInt(id);

  try {
    const result = await prisma.$transaction(async (prisma) => {
      const deleteUserDetails = await prisma.review.delete({
        where: {
          id: reviewId,
        },
      });

      return deleteUserDetails;
    });

    return result;
  } catch (error) {
    throw new ApiError(500, (error as Error).message);
  }
};

export const userService = {
  insertIntoDB,
  updateOneInDB,
  getByIdFromDB,
  getAllFromDB,
  deleteByIdFromDB,
  getByIdForDownloadFromDB,
  getMyTeamFromDB,
  insertReviewIntoDB,
  getMyReceivedReviewFromDB,
  deleteReviewByIdFromDB,
};
