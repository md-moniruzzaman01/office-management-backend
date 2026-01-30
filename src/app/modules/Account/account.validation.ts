import z from 'zod';

const createAccount = z.object({
  body: z.object({
    balance: z.number().optional(),
    branchId: z.number({ required_error: 'branchId is required' }),
  }),
});

const updateAccount = z.object({
  body: z.object({
    balance: z.number().optional(),
    branchId: z.number().optional(),
  }),
});

export const accountValidation = {
  createAccount,
  updateAccount,
};
