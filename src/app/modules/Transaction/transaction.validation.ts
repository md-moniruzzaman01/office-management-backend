import z from 'zod';

const createTransaction = z.object({
  body: z.object({
    note: z.string().optional(),
    amount: z.number({ required_error: 'amount is required' }),
    type: z.enum(['DEPOSIT', 'WITHDRAW']),
    requestedById: z.number({ required_error: 'requestedById is required' }),
    branchId: z.union([
      z.number({ required_error: 'branchId is required' }),
      z.null(),
    ]),
    companyId: z.union([
      z.number({ required_error: 'branchId is required' }),
      z.null(),
    ]),
    departmentId: z.union([z.number(), z.null()]).optional(),
  }),
});

const updateTransaction = z.object({
  body: z.object({
    note: z.string().optional(),
    type: z.string().optional(),
    requestedById: z.number().optional(),
    branchId: z.union([z.number(), z.null()]).optional(),
    companyId: z.union([z.number(), z.null()]).optional(),
    departmentId: z.union([z.number(), z.null()]).optional(),
    amount: z.number().optional(),
  }),
});

export const transactionValidation = {
  createTransaction,
  updateTransaction,
};
