import z from 'zod';

const createBranch = z.object({
  body: z.object({
    name: z.string({
      required_error: 'branch name is required',
    }),
    address: z.string({
      required_error: 'address is required',
    }),
    contactNo: z.string({
      required_error: 'contactNo is required',
    }),
    companyId: z.number({
      required_error: 'companyId is required',
    }),
  }),
});

const updateBranch = z.object({
  body: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    contactNo: z.string().optional(),
    companyId: z.number().optional(),
  }),
});

export const branchValidation = {
  createBranch,
  updateBranch,
};
