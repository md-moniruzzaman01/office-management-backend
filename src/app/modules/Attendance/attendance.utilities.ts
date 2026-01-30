import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { Request } from 'express';
import { ENUM_ATTENDANCE_STATUS } from '../../../enum/attendance';

export const getAttendanceDataFromMachine = (
  req: Request
): Promise<{
  fingerId: string;
  date: string;
  time: string;
  checkType: string;
  verifyCode: string;
  workCode: string | null;
  reserve: string | null;
} | null> => {
  return new Promise((resolve, reject) => {
    if (req.query.table !== 'ATTLOG') {
      return resolve(null); // Skip silently
    }

    req.setEncoding('utf8');
    let rawData = '';

    req.on('data', (chunk) => {
      rawData += chunk;
    });

    req.on('end', () => {
      try {
        const lines = rawData.trim().split('\n');

        // Find valid punch line: starts with number & doesn't contain OPLOG
        const validLine = lines.find((line) => {
          const firstToken = line.trim().split(/\s+/)[0];
          return /^\d+$/.test(firstToken) && !line.includes('OPLOG');
        });

        if (!validLine) {
          return resolve(null); // Skip silently
        }

        const data = validLine.trim().split(/\s+/);
        resolve({
          fingerId: data[0],
          date: data[1],
          time: data[2],
          checkType: data[3],
          verifyCode: data[4],
          workCode: data[5] || null,
          reserve: data[6] || null,
        });
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
};

export function determineStatus({
  checkInTime,
  checkOutTime,
  workingStart,
  workingEnd,
}: {
  checkInTime: Date | null;
  checkOutTime: Date | null;
  workingStart: Date;
  workingEnd: Date;
}): ENUM_ATTENDANCE_STATUS {
  const workingStartMs = workingStart.getTime();
  const workingEndMs = workingEnd.getTime();
  const workingDuration = workingEndMs - workingStartMs;
  const HALF_DAY_MS = workingDuration / 2;

  if (!checkInTime) return ENUM_ATTENDANCE_STATUS.ABSENT;

  const checkInMs = checkInTime.getTime();
  const checkOutMs =
    checkOutTime instanceof Date ? checkOutTime.getTime() : null;

  //  Handle invalid case: checkout before check-in
  const validCheckOutMs =
    checkOutMs && checkOutMs > checkInMs ? checkOutMs : null;

  const totalWorkedMs = validCheckOutMs ? validCheckOutMs - checkInMs : 0;

  const isHalfDay = (() => {
    if (!validCheckOutMs) {
      // No valid checkout — use check-in time only
      return checkInMs > workingStartMs + HALF_DAY_MS;
    }
    return (
      checkInMs > workingStartMs + HALF_DAY_MS ||
      validCheckOutMs < workingStartMs + HALF_DAY_MS ||
      totalWorkedMs < HALF_DAY_MS
    );
  })();

  if (isHalfDay) return ENUM_ATTENDANCE_STATUS.HALF_DAY;

  if (checkInMs > workingStartMs) return ENUM_ATTENDANCE_STATUS.LATE;

  return ENUM_ATTENDANCE_STATUS.ON_TIME;
}

// Helper: Converts time string ("09:30") to full Date with today's date
export const getDateWithTime = (
  timeString: string,
  date?: Date | string
): Date => {
  if (!timeString) return new Date('Invalid');

  const [time, modifier] = timeString.split(' ');
  // eslint-disable-next-line prefer-const
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const baseDate = date ?? new Date().toISOString().split('T')[0];

  return new Date(`${baseDate}T${formattedTime}:00`);
};

export const getFullMonthDates = (year: number, month: number) => {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);

  const dates = eachDayOfInterval({ start, end }).map((date) => ({
    date: format(date, 'yyyy-MM-dd'),
  }));

  return dates;
};
