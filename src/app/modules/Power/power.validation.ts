import z from 'zod';

const createPower = z.object({
  body: z.object({
    name: z.enum(['DASHBOARD', 'TRANSACTION', 'BRANCH', 'DEPARTMENT', 'USERS']),
  }),
});

const updatePower = z.object({
  body: z.object({
    name: z
      .enum(['DASHBOARD', 'TRANSACTION', 'BRANCH', 'DEPARTMENT', 'USERS'])
      .optional(),
  }),
});

export const powerValidation = {
  createPower,
  updatePower,
};
