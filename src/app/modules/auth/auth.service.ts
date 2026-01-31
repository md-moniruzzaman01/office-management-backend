/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from 'jsonwebtoken';
//
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { default as max, default as min } from 'dayjs/plugin/minMax';

import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import prisma from '../../../shared/prisma';
import {
  generateVerificationCode,
  sendVerificationEmail,
  storeVerificationCode,
} from './auth.emailverify';
import { ILoginUser, ILoginUserResponse } from './auth.interface';
import { isPasswordMatched, isUserExist } from './auth.utils';
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrBefore);
dayjs.extend(min);
dayjs.extend(max);

async function loginUser(payload: ILoginUser): Promise<ILoginUserResponse> {
  const { email: userEmail, password } = payload;
  const user = await isUserExist(userEmail);
  if (!user) {
    throw new ApiError(400, 'User does not exist');
  }

  // if (!user?.verified) {
  //   throw new ApiError(403, 'Your account is not verified');
  // }
  if (user?.status !== 'ACTIVATE') {
    throw new ApiError(403, 'Your account is deactivated');
  }

  if (user.password && !(await isPasswordMatched(password, user.password))) {
    throw new ApiError(403, 'Password is incorrect');
  }

  const { id, email, role, powers, verified } = user;
  const userDetails = await prisma.user.findUnique({
    where: { id: id },
    select: {
      role: true,
    },
  });

  const secret = config.jwt.secret;

  if (!secret) {
    throw new ApiError(403, 'secret is not defined');
  }

  const accessToken = jwt.sign({ id, email, role, powers, verified }, secret, {
    expiresIn: config.jwt.expires_in,
  });

  const refreshToken = jwt.sign({ id, email, role, powers, verified }, secret, {
    expiresIn: config.jwt.refresh_expires_in,
  });

  return {
    accessToken,
    refreshToken,
    data: userDetails,
  };
}

const resetPassword = async (payload: {
  userId: number;
  newPassword: string;
}) => {
  const { userId, newPassword } = payload;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(400, 'User not found!');
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bycrypt_salt_rounds)
  );

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

const updateVerificationStatus = async (email: string, verified: boolean) => {
  const result = await prisma.userDetails.updateMany({
    where: { email },
    data: { verified, status: 'ACTIVATE' },
  });
  return result;
};

const resendVerificationMail = async (id: number) => {
  const result = await prisma.userDetails.findUnique({
    where: {
      id: id,
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }

  if (result.verified) {
    throw new ApiError(400, 'User already verified');
  }

  const { email } = result;

  const verificationCode = generateVerificationCode();
  storeVerificationCode(email, verificationCode);
  await sendVerificationEmail(email, verificationCode);
  return {
    email: result.email,
    resend: true,
  };
};

export const getMeFromDB = async (userId: string): Promise<any> => {
  const result = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      email: true,
      role: true,
      details: {
        select: {
          attendances: {
            orderBy: { date: 'asc' },
            include: { logs: true }, // ✅ include logs
          },
          fingerId: true,
          name: true,
          bloodGroup: true,
          address: true,
          skills: true,
          joiningDate: true,
          status: true,
          dateOfBirth: true,
          terminationDate: true,
          leaves: { where: { status: 'APPROVED' } },
          employeeId: true,
          resignationDate: true,
          exitType: true,
          exitReason: true,
          lastWorkingDay: true,
          powers: { select: { name: true } },
          verified: true,
          contactNo: true,
          designation: true,
          profileImage: true,
          nidImage: true,
          roasters: true,
          cvImages: true,
          email: true,
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
                      padImage: true,
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

  // ⏱ Utility: get first check-in & last check-out from logs
  const getDayInfo = (attendance: any) => {
    if (!attendance.logs || attendance.logs.length === 0) return null;

    const checkIns = attendance.logs
      .filter((l: { type: string }) => l.type === 'CHECK_IN')
      .map((l: { time: string }) => dayjs(l.time));

    const checkOuts = attendance.logs
      .filter((l: { type: string }) => l.type === 'CHECK_OUT')
      .map((l: { time: string }) => dayjs(l.time));

    const firstCheckIn = checkIns.length ? dayjs.min(checkIns) : null;
    const lastCheckOut = checkOuts.length ? dayjs.max(checkOuts) : null;

    let duration = 0;
    if (firstCheckIn && lastCheckOut) {
      duration = lastCheckOut.diff(firstCheckIn, 'minute') / 60;
    }

    return {
      date: dayjs(attendance.date),
      checkIn: firstCheckIn,
      checkOut: lastCheckOut,
      duration,
      status: attendance.status,
    };
  };

  const processed = attendances.map(getDayInfo).filter(Boolean) as {
    date: dayjs.Dayjs;
    checkIn: dayjs.Dayjs | null;
    checkOut: dayjs.Dayjs | null;
    duration: number;
    status: string;
  }[];

  const isSameDay = (a: dayjs.Dayjs, b: dayjs.Dayjs) => a.isSame(b, 'day');
  const todayInfo = processed.find((a) => isSameDay(a.date, today));
  const weekInfo = processed.filter((a) => a.date.isSame(today, 'week'));
  const monthInfo = processed.filter((a) => a.date.isSame(today, 'month'));

  const todayHours = todayInfo?.duration || 0;
  const weeklyHours = weekInfo.reduce((s, a) => s + a.duration, 0);
  const monthlyHours = monthInfo.reduce((s, a) => s + a.duration, 0);

  const todayCheckIn = todayInfo?.checkIn?.format('HH:mm:ss') || null;
  const todayCheckOut = todayInfo?.checkOut?.format('HH:mm:ss') || null;

  // 📅 Working days in month
  const mapWeekday = (day: string) =>
    day.charAt(0) + day.slice(1).toLowerCase();

  const workingDays = department?.weeklyWorkingDays?.length
    ? department.weeklyWorkingDays.map(mapWeekday)
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const workingDaysInMonth: string[] = [];
  let cursor = startOfMonth.clone();
  while (cursor.isSameOrBefore(today)) {
    if (workingDays.includes(cursor.format('dddd'))) {
      workingDaysInMonth.push(cursor.format('YYYY-MM-DD'));
    }
    cursor = cursor.add(1, 'day');
  }

  // 🟢 Present/Absent
  const attendedDaysSet = new Set(
    monthInfo.map((a) => a.date.format('YYYY-MM-DD'))
  );

  const absentDays = workingDaysInMonth.filter((d) => !attendedDaysSet.has(d));
  const presentDays = workingDaysInMonth.length - absentDays.length;

  // 🕐 Late Count
  const lateCount = monthInfo.filter((a) => {
    if (!a.checkIn) return false;
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
    const checkInTime = dayjs(a.checkIn);

    return checkInTime.isAfter(scheduled);
  }).length;

  // ⏰ Avg Check-in
  const avgCheckIn = (() => {
    const validTimes = monthInfo
      .filter((a) => a.checkIn)
      .map((a) => a.checkIn!) as dayjs.Dayjs[];
    if (!validTimes.length) return null;
    const totalMinutes = validTimes.reduce(
      (s, t) => s + t.hour() * 60 + t.minute(),
      0
    );
    const avg = totalMinutes / validTimes.length;
    const h = Math.floor(avg / 60);
    const m = Math.floor(avg % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  })();

  // 🔥 Streak
  let streak = 0;
  for (let i = workingDaysInMonth.length - 1; i >= 0; i--) {
    const date = workingDaysInMonth[i];
    if (attendedDaysSet.has(date)) streak++;
    else break;
  }

  // ❌ Last Absent
  const explicitAbsentDays = processed
    .filter((a) => a.status === 'ABSENT')
    .map((a) => a.date.format('YYYY-MM-DD'))
    .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());
  const lastAbsent =
    explicitAbsentDays.length > 0 ? explicitAbsentDays[0] : null;

  // 📊 Recent Activity
  const recentActivity = processed
    .slice(-6)
    .reverse()
    .map((a) => ({
      date: a.date.format('YYYY-MM-DD'),
      checkIn: a.checkIn?.format('HH:mm') || '—',
      checkOut: a.checkOut?.format('HH:mm') || '—',
      duration: a.duration.toFixed(2),
      status: a.status,
    }));

  // 📈 Weekly Chart
  const weeklyData = workingDays.map((day) => {
    const hours = weekInfo
      .filter((a) => a.date.format('dddd') === day)
      .reduce((s, a) => s + a.duration, 0);
    return { name: day.slice(0, 3), hours: parseFloat(hours.toFixed(2)) };
  });

  const monthAttendances = attendances.filter((a) =>
    dayjs(a.date).isSame(today, 'month')
  );

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

  // 📅 Monthly Chart
  const weeksMap: Record<string, number> = {};
  monthInfo.forEach((a) => {
    const week = Math.ceil(a.date.date() / 7);
    const key = `Week ${week}`;
    weeksMap[key] = (weeksMap[key] || 0) + a.duration;
  });
  const monthlyData = Array.from({ length: 5 }).map((_, i) => {
    const name = `Week ${i + 1}`;
    return { name, hours: parseFloat((weeksMap[name] || 0).toFixed(2)) };
  });

  // 📊 Yearly Chart
  const yearlyMap: Record<string, number> = {};
  processed.forEach((a) => {
    const m = a.date.format('MMM');
    yearlyMap[m] = (yearlyMap[m] || 0) + a.duration;
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
      overTimeHours: Math.max(
        0,
        monthlyHours - totalWorkingTimeThisMonth
      ).toFixed(2),
      weeklyAvgHours: (weeklyHours / (weekInfo.length || 1)).toFixed(2),
      monthlyAvgHours: (monthlyHours / (monthInfo.length || 1)).toFixed(2),
      weeklyData,
      monthlyData,
      yearlyData,
      absentDays: absentDays.length,
      lateCount,
      avgCheckIn,
      streak,
      lastAbsent,
      recentActivity,
      daysInMonth: workingDaysInMonth.length,
      presentDays,
    },
  };
};

export const AuthService = {
  loginUser,
  resetPassword,
  updateVerificationStatus,
  resendVerificationMail,
  getMeFromDB,
};
