/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

export const formatDate = (date?: Date) =>
  date
    ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
    : '';

export const generateAttendanceSummary = (
  attendances: any[],
  department: {
    workingTimeStart?: string | null;
    weeklyWorkingDays?: string[] | null;
  },
  filters?: {
    startDate?: string;
    endDate?: string;
  }
) => {
  const today = dayjs();
  const startDate = filters?.startDate
    ? dayjs(filters.startDate)
    : today.startOf('month');
  const endDate = filters?.endDate ? dayjs(filters.endDate) : today;

  const toDateTime = (date: Date, timeStr?: string | null) =>
    timeStr ? dayjs(`${dayjs(date).format('YYYY-MM-DD')}T${timeStr}`) : null;

  const calcDuration = (
    date: Date,
    start?: string | null,
    end?: string | null
  ) => {
    if (!start || !end) return 0;
    const startDt = toDateTime(date, start);
    const endDt = toDateTime(date, end);
    if (!startDt || !endDt) return 0;
    if (endDt.isBefore(startDt))
      return endDt.add(1, 'day').diff(startDt, 'minute') / 60;
    return endDt.diff(startDt, 'minute') / 60;
  };

  const sumDurations = (records: typeof attendances) =>
    records.reduce(
      (sum, a) => sum + calcDuration(a.date, a.checkIn, a.checkOut),
      0
    );

  const filterRange = (records: typeof attendances) =>
    records.filter((a) =>
      dayjs(a.date).isBetween(startDate, endDate, 'day', '[]')
    );

  const workingDays = department?.weeklyWorkingDays?.length
    ? department.weeklyWorkingDays.map(
        (d) => d.charAt(0) + d.slice(1).toLowerCase()
      )
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const workingDaysInRange: string[] = [];
  let cursor = startDate.clone();
  while (cursor.isSameOrBefore(endDate)) {
    if (workingDays.includes(cursor.format('dddd'))) {
      workingDaysInRange.push(cursor.format('YYYY-MM-DD'));
    }
    cursor = cursor.add(1, 'day');
  }

  const rangeAttendances = filterRange(attendances);
  const filteredMonthAttendances = rangeAttendances.filter(
    (a) => a.checkIn || a.checkOut
  );
  const attendedDaysSet = new Set(
    filteredMonthAttendances.map((a) => dayjs(a.date).format('YYYY-MM-DD'))
  );

  const absentDays = workingDaysInRange.filter(
    (day) => !attendedDaysSet.has(day)
  );
  const presentDays = workingDaysInRange.length - absentDays.length;

  const lateCount = filteredMonthAttendances.filter((a) => {
    const checkIn = toDateTime(a.date, a.checkIn);
    const scheduledHour = Number(
      department?.workingTimeStart?.split(':')[0] ?? 0
    );
    const scheduled = dayjs(a.date).hour(scheduledHour);
    return checkIn && checkIn.isAfter(scheduled.add(5, 'minute'));
  }).length;

  const avgCheckIn = () => {
    const validTimes = filteredMonthAttendances
      .map((a) => toDateTime(a.date, a.checkIn))
      .filter(Boolean) as dayjs.Dayjs[];
    if (!validTimes.length) return null;
    const totalMinutes = validTimes.reduce(
      (sum, t) => sum + t.hour() * 60 + t.minute(),
      0
    );
    const avg = totalMinutes / validTimes.length;
    const h = Math.floor(avg / 60);
    const m = Math.floor(avg % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  let streak = 0;
  for (let i = workingDaysInRange.length - 1; i >= 0; i--) {
    const date = workingDaysInRange[i];
    if (attendedDaysSet.has(date)) streak++;
    else break;
  }

  const explicitAbsentDays = rangeAttendances
    .filter((a) => a.status === 'ABSENT')
    .map((a) => dayjs(a.date).format('YYYY-MM-DD'))
    .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());
  const lastAbsent =
    explicitAbsentDays.length > 0 ? explicitAbsentDays[0] : null;

  const recentActivity = [...rangeAttendances]
    .reverse()
    .slice(0, 6)
    .map((a) => ({
      date: dayjs(a.date).format('YYYY-MM-DD'),
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      duration: calcDuration(a.date, a.checkIn, a.checkOut).toFixed(2),
      status: a.status,
    }));

  const weeklyDays = new Set(
    rangeAttendances
      .filter((a) => a.checkIn || a.checkOut)
      .map((a) => dayjs(a.date).format('YYYY-MM-DD'))
  ).size;

  const monthlyDays = attendedDaysSet.size;
  const weeklyHours = sumDurations(
    rangeAttendances.filter((a) => dayjs(a.date).isSame(endDate, 'week'))
  );
  const monthlyHours = sumDurations(rangeAttendances);
  const todayHours = sumDurations(
    rangeAttendances.filter((a) => dayjs(a.date).isSame(endDate, 'day'))
  );
  const weeklyAvgHours = weeklyDays ? weeklyHours / weeklyDays : 0;
  const monthlyAvgHours = monthlyDays ? monthlyHours / monthlyDays : 0;
  const overTimeHours = Math.max(0, monthlyHours - 160);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = daysOfWeek.map((day) => {
    const hours = rangeAttendances
      .filter((a) => dayjs(a.date).format('ddd') === day)
      .reduce((sum, a) => sum + calcDuration(a.date, a.checkIn, a.checkOut), 0);
    return { name: day, hours: parseFloat(hours.toFixed(2)) };
  });

  const weeksMap: Record<string, number> = {};
  filteredMonthAttendances.forEach((a) => {
    const week = Math.ceil(dayjs(a.date).date() / 7);
    const key = `Week ${week}`;
    const dur = calcDuration(a.date, a.checkIn, a.checkOut);
    weeksMap[key] = (weeksMap[key] || 0) + dur;
  });
  const monthlyData = Array.from({ length: 5 }).map((_, i) => {
    const name = `Week ${i + 1}`;
    return { name, hours: parseFloat((weeksMap[name] || 0).toFixed(2)) };
  });

  const yearlyMap: Record<string, number> = {};
  rangeAttendances.forEach((a) => {
    const m = dayjs(a.date).format('MMM');
    const dur = calcDuration(a.date, a.checkIn, a.checkOut);
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

  const todayCheckIn = rangeAttendances.find(
    (a) => dayjs(a.date).isSame(endDate, 'day') && a.checkIn
  )
    ? toDateTime(
        endDate.toDate(),
        rangeAttendances.find((a) => dayjs(a.date).isSame(endDate, 'day'))!
          .checkIn
      )?.format('HH:mm:ss')
    : null;

  const todayCheckOut = rangeAttendances.find(
    (a) => dayjs(a.date).isSame(endDate, 'day') && a.checkOut
  )
    ? toDateTime(
        endDate.toDate(),
        rangeAttendances.find((a) => dayjs(a.date).isSame(endDate, 'day'))!
          .checkOut
      )?.format('HH:mm:ss')
    : null;

  return {
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
    daysInMonth: workingDaysInRange.length,
    presentDays,
  };
};
