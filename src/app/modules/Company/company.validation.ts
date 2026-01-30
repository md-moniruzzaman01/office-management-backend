import z from 'zod';

const createCompany = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Company name is required',
    }),
    padImage: z.string().optional(),
  }),
});

const updateCompany = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Company name is required',
    }),
    padImage: z.string().optional(),
  }),
});

export const companyValidation = {
  createCompany,
  updateCompany,
};
