import { endOfToday, startOfToday } from 'date-fns';
import ExcelJS from 'exceljs';
import { Response } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import prisma from '../../../shared/prisma';

export const getAllFromDB = async () => {
  const today = new Date();

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59
  );

  const [
    users,
    holidays,
    events,
    transactions,
    accountBalanceRaw,
    totalEmployee,
    totalActiveEmployees,
    firstAccount,
    pendingLeaveAction,
    lastAttendance,
    topEmployeesRaw, // 👈 added
  ] = await Promise.all([
    prisma.user.count(),

    prisma.holiday.count({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }),

    prisma.departmentEvent.count({
      where: {
        startDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),

    prisma.transaction.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),

    prisma.account.aggregate({
      _sum: {
        balance: true,
      },
    }),

    prisma.user.count({
      where: {
        role: {
          in: [
            ENUM_USER_ROLE.EMPLOYEE,
            ENUM_USER_ROLE.HR,
            ENUM_USER_ROLE.INCHARGE,
            ENUM_USER_ROLE.MANAGER,
          ],
        },
      },
    }),

    prisma.userDetails.count({
      where: {
        status: 'ACTIVATE',
        user: {
          role: {
            in: ['EMPLOYEE', 'HR'],
          },
        },
      },
    }),

    prisma.userDetails.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        createdAt: true,
      },
    }),

    prisma.leave.count({
      where: {
        status: 'PENDING',
      },
    }),

    prisma.attendance.findMany({
      where: {
        status: {
          in: ['LATE', 'HALF_DAY'],
        },
        createdAt: {
          gte: startOfToday(),
          lte: endOfToday(),
        },
      },
      take: 4,
      orderBy: {
        createdAt: 'desc', // latest attendance record first
      },
      select: {
        id: true,
        status: true,
        fingerId: true,
        createdAt: true,
        updatedAt: true,
        date: true,
        user: {
          select: {
            name: true,
            profileImage: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
        logs: {
          where: {
            type: 'CHECK_IN', // <-- Only take entry logs
          },
          select: {
            time: true, // <-- This is the entry time
          },
          orderBy: {
            time: 'asc',
          },
          take: 1, // <-- Only the first entry log
        },
      },
    }),

    // 🏆 Fetch employees for Top 5 ranking
    prisma.userDetails.findMany({
      where: {
        status: 'ACTIVATE',
        user: {
          role: {
            in: [
              ENUM_USER_ROLE.EMPLOYEE,
              ENUM_USER_ROLE.HR,
              ENUM_USER_ROLE.INCHARGE,
              ENUM_USER_ROLE.MANAGER,
            ],
          },
        },
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        designation: true,
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
        attendances: { select: { status: true } },
        reviewsReceived: { select: { rating: true } },
      },
    }),
  ]);

  // 🧮 Average Employee Calculation
  const currentYear = today.getFullYear();
  const startYear = firstAccount?.createdAt.getFullYear() ?? currentYear;
  const yearsPassed = Math.max(currentYear - startYear + 1, 1);
  const averageEmployee = totalActiveEmployees / yearsPassed;

  const formattedAttendance = lastAttendance.map((a) => ({
    ...a,
    entryTime: a.logs[0]?.time ?? null,
  }));

  const topEmployees = topEmployeesRaw
    .map((emp) => {
      const total = emp.attendances.length;
      const onTime = emp.attendances.filter(
        (a) => a.status === 'ON_TIME'
      ).length;

      const attendanceScore = total > 0 ? (onTime / total) * 5 : 0;

      const reviewCount = emp.reviewsReceived.length;
      const reviewAvg =
        reviewCount > 0
          ? emp.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
            reviewCount
          : 0;

      const finalRating = (attendanceScore * 0.6 + reviewAvg * 0.4).toFixed(2);

      return {
        id: emp.id,
        name: emp.name,
        profileImage: emp.profileImage,
        designation: emp.designation,
        department: emp.department?.name ?? '',
        branch: emp?.department?.branch?.name ?? '',
        company: emp?.department?.branch?.company?.name ?? '',
        rating: parseFloat(finalRating),
      };
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const data = {
    users,
    holidays,
    events,
    transactions,
    accountBalance: accountBalanceRaw._sum.balance ?? 0,
    totalEmployee,
    averageEmployee,
    activeEmployee: totalActiveEmployees,
    pendingLeaveAction,
    lastAttendance: formattedAttendance,
    topEmployees,
  };

  return data;
};

export const getAllForDownloadFromDB = async (
  filters: { startDate?: string; endDate?: string },
  res: Response
) => {
  try {
    const { startDate, endDate } = filters;
    const dateRange =
      startDate && endDate
        ? { gte: new Date(startDate), lte: new Date(endDate) }
        : undefined;

    const companies = await prisma.company.findMany({
      include: {
        branches: {
          include: {
            account: true, // include account
            transactions: {
              where: { createdAt: dateRange },
              include: {
                account: {
                  include: {
                    branch: true,
                    // Prisma can't auto-include department on account directly
                  },
                },
                requestedBy: true,
                createdBy: true,
                branch: true,
                company: true,
              },
            },
            departments: {
              include: {
                users: {
                  where: { verified: true, status: 'ACTIVATE' },
                  include: {
                    user: true,
                    requisitionsRequested: {
                      where: { status: 'APPROVED', createdAt: dateRange },
                    },
                    attendances: {
                      where: dateRange ? { date: dateRange } : {},
                      include: { logs: true },
                    },
                  },
                },

                transactions: {
                  where: { createdAt: dateRange },
                  include: { account: true },
                },
                requisitions: {
                  where: { status: 'APPROVED', createdAt: dateRange },
                },
              },
            },
            requisitions: {
              where: { status: 'APPROVED', createdAt: dateRange },
            },
          },
        },
        transactions: {
          where: { createdAt: dateRange },
          include: { account: true },
        },
        requisitions: { where: { status: 'APPROVED', createdAt: dateRange } },
      },
    });

    const workbook = new ExcelJS.Workbook();

    // 1️⃣ Companies Sheet
    const companySheet = workbook.addWorksheet('Companies'.slice(0, 31));
    companySheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Branches Count', key: 'branchCount', width: 20 },
      { header: 'Transactions Count', key: 'transactionCount', width: 20 },
      { header: 'Requisitions Count', key: 'requisitionCount', width: 20 },
    ];
    companies.forEach((c) =>
      companySheet.addRow({
        id: c.id,
        name: c.name,
        branchCount: c.branches.length,
        transactionCount: c.transactions.length,
        requisitionCount: c.requisitions.length,
      })
    );

    // 2️⃣ Branch Sheet
    const branchSheet = workbook.addWorksheet('Branches'.slice(0, 31));
    branchSheet.columns = [
      { header: 'Branch ID', key: 'id', width: 10 },
      { header: 'Branch Name', key: 'name', width: 25 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Department Count', key: 'departmentCount', width: 20 },
      { header: 'Transactions Count', key: 'transactionCount', width: 20 },
      { header: 'Requisitions Count', key: 'requisitionCount', width: 20 },
      { header: 'Has Account', key: 'hasAccount', width: 15 },
    ];
    companies.forEach((c) =>
      c.branches.forEach((b) =>
        branchSheet.addRow({
          id: b.id,
          name: b.name,
          company: c.name,
          departmentCount: b.departments.length,
          transactionCount: b.transactions.length,
          requisitionCount: b.requisitions.length,
          hasAccount: b.account ? 'Yes' : 'No',
        })
      )
    );

    // 3️⃣ Department Sheet
    const deptSheet = workbook.addWorksheet('Departments'.slice(0, 31));
    deptSheet.columns = [
      { header: 'Department ID', key: 'id', width: 10 },
      { header: 'Department Name', key: 'name', width: 25 },
      { header: 'Branch', key: 'branch', width: 25 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Users Count', key: 'userCount', width: 15 },
      { header: 'Transactions Count', key: 'transactionCount', width: 20 },
      { header: 'Requisitions Count', key: 'requisitionCount', width: 20 },
    ];
    companies.forEach((c) =>
      c.branches.forEach((b) =>
        b.departments.forEach((d) =>
          deptSheet.addRow({
            id: d.id,
            name: d.name,
            branch: b.name,
            company: c.name,
            userCount: d.users.length,
            transactionCount: d.transactions.length,
            requisitionCount: d.requisitions.length,
          })
        )
      )
    );

    // 4️⃣ Users Sheet
    const userSheet = workbook.addWorksheet('Users'.slice(0, 31));
    userSheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Branch', key: 'branch', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Requisitions Count', key: 'requisitionCount', width: 20 },
    ];
    companies.forEach((c) =>
      c.branches.forEach((b) =>
        b.departments.forEach((d) =>
          d.users.forEach((u) =>
            userSheet.addRow({
              employeeId: u.employeeId,
              name: u.name,
              email: u.user.email,
              company: c.name,
              branch: b.name,
              department: d.name,
              requisitionCount: u.requisitionsRequested.length,
            })
          )
        )
      )
    );

    // 5️⃣ Transactions Sheet
    const transactionSheet = workbook.addWorksheet('Transactions'.slice(0, 31));
    transactionSheet.columns = [
      { header: 'Transaction ID', key: 'id', width: 10 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Account ID', key: 'accountId', width: 15 },
      { header: 'Requested By', key: 'requestedBy', width: 25 },
      { header: 'Created By', key: 'createdBy', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Branch', key: 'branch', width: 25 },
      { header: 'Company', key: 'company', width: 25 },
    ];
    companies.forEach((c) =>
      c.branches.forEach((b) =>
        b.transactions.forEach((t) =>
          transactionSheet.addRow({
            id: t.id,
            amount: t.amount,
            type: t.type,
            accountId: t.accountId,
            requestedBy: t.requestedBy?.name || '-',
            createdBy: t.createdBy?.name || '-',
            branch: t.branch?.name || b.name,
            company: t.company?.name || c.name,
          })
        )
      )
    );

    // 6️⃣ Requisitions Sheet
    const requisitionSheet = workbook.addWorksheet('Requisitions'.slice(0, 31));
    requisitionSheet.columns = [
      { header: 'Requisition ID', key: 'id', width: 10 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Requested By', key: 'requestedBy', width: 25 },
      { header: 'Created By', key: 'createdBy', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Branch', key: 'branch', width: 25 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    companies.forEach((c) =>
      c.branches.forEach((b) =>
        b.departments.forEach((d) =>
          d.users.forEach((u) =>
            u.requisitionsRequested.forEach((r) =>
              requisitionSheet.addRow({
                id: r.id,
                title: r.title,
                total: r.total,
                requestedBy: u.name,
                createdBy: r.createdById,
                department: d.name,
                branch: b.name,
                company: c.name,
                status: r.status,
              })
            )
          )
        )
      )
    );

    // 7️⃣ Attendance Sheet
    const attendanceSheet = workbook.addWorksheet('Attendance'.slice(0, 31));
    attendanceSheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Check-in', key: 'checkIn', width: 20 },
      { header: 'Check-out', key: 'checkOut', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Duration', key: 'duration', width: 15 },
    ];

    companies.forEach((c) =>
      c.branches.forEach((b) =>
        b.departments.forEach((d) =>
          d.users.forEach((u) => {
            u.attendances
              .filter(
                (a) =>
                  !dateRange ||
                  (a.date >= dateRange.gte && a.date <= dateRange.lte)
              )
              .forEach((a) => {
                const checkIn = a.logs.find((l) => l.type === 'CHECK_IN')?.time;
                const checkOut = a.logs.find(
                  (l) => l.type === 'CHECK_OUT'
                )?.time;

                let durationStr = '-';
                if (checkIn && checkOut) {
                  const diffMs = checkOut.getTime() - checkIn.getTime();
                  const hours = Math.floor(diffMs / 1000 / 3600);
                  const minutes = Math.floor((diffMs / 1000 / 60) % 60);
                  const seconds = Math.floor((diffMs / 1000) % 60);
                  durationStr = `${hours}h ${minutes}m ${seconds}s`;
                }

                attendanceSheet.addRow({
                  employeeId: u.employeeId,
                  name: u.name,
                  date: a.date.toISOString().split('T')[0],
                  checkIn: checkIn ? checkIn.toLocaleTimeString() : '-',
                  checkOut: checkOut ? checkOut.toLocaleTimeString() : '-',
                  status: a.status,
                  duration: durationStr,
                });
              });
          })
        )
      )
    );

    // Send Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=full_company_data.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel Export Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const DashboardService = {
  getAllFromDB,
  getAllForDownloadFromDB,
};
