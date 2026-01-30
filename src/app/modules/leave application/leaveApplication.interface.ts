import { LeaveStatus, LeaveType } from '@prisma/client';

export type ILeaveApplicationFilterRequest = {
  searchTerm?: string | undefined;
};

export type ILeaveApplicationCreatedEvent = {
  name: string;
};

export interface LeaveFrontendSafe {
  id: number;
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  leaveDays: number;
  reason: string;
  details: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
    department?: {
      // <-- mark optional
      name: string;
      branch: {
        name: string;
        company: {
          name: string;
        };
      };
    } | null; // <-- also allow null
  };
}
