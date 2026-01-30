/* eslint-disable @typescript-eslint/no-explicit-any */
import cron from 'node-cron';
import { ENUM_ATTENDANCE_STATUS } from '../enum/attendance';
// import { logger } from "../shared/logger";
import prisma from '../shared/prisma';

// Helper function
function isWorkingDay(date: Date, workingDays: string[]): boolean {
  const day = date
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase(); // e.g. "MONDAY"
  return workingDays.includes(day);
}

// Helper: build Date with today's date + department endTime
function getDepartmentEndTime(today: Date, endTime: string): Date {
  if (!endTime) {
    console.warn('⚠️ endTime missing — defaulting to 18:00');
    const fallback = new Date(today);
    fallback.setHours(18, 0, 0, 0);
    return fallback;
  }

  // Normalize to 24-hour format
  const timeStr = endTime.trim().toUpperCase();

  let hours = 0;
  let minutes = 0;

  const isPM = timeStr.includes('PM');
  const isAM = timeStr.includes('AM');

  const clean = timeStr.replace(/AM|PM/g, '').trim();
  const [h, m] = clean.split(':').map(Number);
  hours = h;
  minutes = m || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  const newDate = new Date(today);
  newDate.setHours(hours, minutes, 0, 0);

  return newDate;
}

cron.schedule(
  '45 23 * * *',
  async () => {
    console.log('⏰ Running attendance generator cron job...');

    try {
      // 🔹 Get today's date in Asia/Dhaka timezone
      const today = new Date();
      const todayLocal = new Date(
        today.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
      );
      const todayStr = todayLocal.toISOString().split('T')[0];
      const todayDate = new Date(todayStr);

      // 🔹 Time boundaries for safe date range query
      const startOfDay = new Date(todayDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(todayDate);
      endOfDay.setHours(23, 59, 59, 999);

      // 🔹 Fetch all active, verified users with departments
      const allUsers = await prisma.userDetails.findMany({
        where: { verified: true, status: 'ACTIVATE' },
        select: {
          id: true,
          roasters: true,
          fingerId: true,
          department: {
            select: {
              workingTimeStart: true,
              workingTimeEnd: true,
              weeklyWorkingDays: true,
            },
          },
        },
      });

      for (const user of allUsers) {
        if (!user.department || !user.fingerId) continue;

        // 🔹 Check if today is a working day
        const isWorking = isWorkingDay(
          todayLocal,
          user.department.weeklyWorkingDays
        );
        if (!isWorking) continue;

        // 🔹 Check if the user has a roaster for today
        const hasRoasterToday = user.roasters?.some((r) => r === todayStr);

        // 🔹 Check if attendance already exists
        const attendance = await prisma.attendance.findFirst({
          where: {
            fingerId: user.fingerId,
            date: { gte: startOfDay, lte: endOfDay },
          },
          select: {
            logs: true,
            status: true,
            id: true,
          },
        });

        // ✅ Attendance already exists
        if (attendance) {
          if (
            [
              ENUM_ATTENDANCE_STATUS.ABSENT,
              ENUM_ATTENDANCE_STATUS.LEAVE,
              ENUM_ATTENDANCE_STATUS.ROASTER,
            ].includes(attendance.status as ENUM_ATTENDANCE_STATUS)
          ) {
            console.log(
              `⚠️ Skipping checkout for ${user.fingerId} (${attendance.status})`
            );
            continue;
          }

          // Add missing checkout if needed
          const hasCheckout = attendance.logs.some(
            (log) => log.type === 'CHECK_OUT'
          );

          if (!hasCheckout) {
            const endTime = getDepartmentEndTime(
              todayLocal,
              user.department.workingTimeEnd
            );

            await prisma.attendanceLog.create({
              data: {
                attendanceId: attendance.id,
                type: 'CHECK_OUT',
                time: endTime,
              },
            });

            console.log(`🕛 Auto CHECK_OUT added for ${user.fingerId}`);
          }

          // Apply roaster if necessary
          if (
            hasRoasterToday &&
            attendance.status !== ENUM_ATTENDANCE_STATUS.ROASTER
          ) {
            await prisma.attendance.update({
              where: { id: attendance.id },
              data: { status: ENUM_ATTENDANCE_STATUS.ROASTER },
            });

            console.log(`📌 ROASTER applied for ${user.fingerId}`);
          }

          continue;
        }

        // ✅ No attendance yet — create one safely
        try {
          if (hasRoasterToday) {
            await prisma.attendance.create({
              data: {
                fingerId: user.fingerId,
                date: todayDate,
                status: ENUM_ATTENDANCE_STATUS.ROASTER,
              },
            });

            console.log(`📌 ROASTER created for ${user.fingerId}`);
            continue;
          }

          // 🔹 Check for approved leave
          const hasLeave = await prisma.leave.findFirst({
            where: {
              userId: user.id,
              status: 'APPROVED',
              startDate: { lte: todayDate },
              endDate: { gte: todayDate },
            },
          });

          // 🔹 Create leave or absent record
          await prisma.attendance.create({
            data: {
              fingerId: user.fingerId,
              date: todayDate,
              status: hasLeave
                ? ENUM_ATTENDANCE_STATUS.LEAVE
                : ENUM_ATTENDANCE_STATUS.ABSENT,
            },
          });

          console.log(
            hasLeave
              ? `📌 LEAVE marked for ${user.fingerId}`
              : `❌ ABSENT marked for ${user.fingerId}`
          );
        } catch (err: any) {
          // Handle duplicate attendance (from unique constraint)
          if (err.code === 'P2002') {
            console.log(
              `⚠️ Attendance already exists for ${user.fingerId}, skipping...`
            );
          } else {
            console.log(
              `❌ Error creating attendance for ${user.fingerId}:`,
              err
            );
          }
        }
      }

      console.log('✅ Attendance status generation completed.');
    } catch (error) {
      console.error('❌ Cron job failed:', error);
    }
  },
  { timezone: 'Asia/Dhaka' }
);
