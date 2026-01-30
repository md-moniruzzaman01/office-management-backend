import z from 'zod';

const createAttendance = z.object({
  body: z.object({
    fingerId: z
      .number({
        required_error: 'User ID is required',
      })
      .int()
      .positive('User ID must be a positive integer'),
    date: z
      .string({
        required_error: 'Date is required',
      })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
    time: z.string({ required_error: 'time is required' }),
    checkType: z.string({ required_error: 'checkType is required' }),
  }),
});

const updateAttendance = z.object({
  body: z.object({
    fingerId: z.number().int().positive().optional(),
    date: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
    time: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid check-in time format',
      }),
    checkType: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid check-out time format',
      }),
  }),
});

export const attendanceValidation = {
  createAttendance,
  updateAttendance,
};
