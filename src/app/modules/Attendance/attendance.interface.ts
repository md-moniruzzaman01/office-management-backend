import { Attendance, UserDetails } from '@prisma/client';

export type IAttendanceFilterRequest = {
  searchTerm?: string | undefined;
  departmentId?: string | undefined;
  month?: string | undefined;
  year?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  status?: string | undefined;
};

export type IAttendanceEventCreatedEvent = {
  name: string;
};

export type UserWithAttendance = Partial<UserDetails> & {
  attendance: Attendance[];
};
