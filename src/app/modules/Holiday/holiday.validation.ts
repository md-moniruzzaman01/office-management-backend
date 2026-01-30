import z from 'zod';

const createHoliday = z.object({
  body: z.object({
    departmentId: z.number().optional(),
    branchId: z.number().optional(),
    name: z.string({
      required_error: 'Holiday name is required',
    }),
    date: z.string({
      required_error: 'Holiday date is required',
    }),
  }),
});

const updateHoliday = z.object({
  body: z.object({
    departmentId: z.number().optional(),
    name: z.string().optional(),
    date: z.string().optional(),
    branchId: z.number().optional(),
  }),
});

export const holidayValidation = {
  createHoliday,
  updateHoliday,
};
