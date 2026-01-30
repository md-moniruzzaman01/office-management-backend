import z from 'zod';

const createEvent = z.object({
  body: z.object({
    departmentId: z.number().optional(),
    branchId: z.number().optional(),
    name: z.string({
      required_error: 'Event name is required',
    }),
    description: z.string().optional(),
    startDate: z.string({
      required_error: 'Event date is required',
    }),
    endDate: z.string({
      required_error: 'Event date is required',
    }),
  }),
});

const updateEvent = z.object({
  body: z.object({
    departmentId: z.number().optional(),
    branchId: z.number().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const eventValidation = {
  createEvent,
  updateEvent,
};
