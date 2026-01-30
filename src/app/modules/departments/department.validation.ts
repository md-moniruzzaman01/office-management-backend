import z from 'zod';

const createDepartment = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Department name is required',
    }),
    supervisorId: z.number().int().optional(), // Supervisor ID is optional
    branchId: z.number().int({
      message: 'Branch ID is required',
    }),
    workingTimeStart: z.string({
      required_error: 'Working start time is required',
    }),
    workingTimeEnd: z.string({
      required_error: 'Working end time is required',
    }),
    yearlyLeaveCount: z.number({
      required_error: 'Yearly leave count is required',
    }),
  }),
});

const updateDepartment = z.object({
  body: z.object({
    name: z.string().optional(),
    supervisorId: z.number().int().optional(),
    branchId: z.number().int().optional(),
    workingTimeStart: z.string().optional(),
    workingTimeEnd: z.string().optional(),
  }),
});

export const departmentValidation = {
  createDepartment,
  updateDepartment,
};
