import z from 'zod';
import { ENUM_LEAVE_STATUS } from '../../../enum/leave';

const createLeaveApplication = z.object({
  body: z.object({
    type: z.enum(['SICK', 'CASUAL', 'PAID', 'UNPAID']).optional(),

    startDate: z.string({
      required_error: 'Start date is required',
    }),
    endDate: z.string({
      required_error: 'End date is required',
    }),
    reason: z.string({
      required_error: 'Reason is required',
    }),
    leaveDays: z.number().min(1, 'Leave Days must be at least 1'),
    details: z.string().optional(),
  }),
});

const updateLeaveApplication = z.object({
  body: z.object({
    type: z.enum(['SICK', 'CASUAL', 'PAID', 'UNPAID']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    reason: z.string().optional(),
    leaveDays: z.number().optional(),
    status: z.nativeEnum(ENUM_LEAVE_STATUS).optional(),
    details: z.string().optional(),
  }),
});

export const leaveApplicationValidation = {
  createLeaveApplication,
  updateLeaveApplication,
};
