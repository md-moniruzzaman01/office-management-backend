import z from 'zod';

const createActivity = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Activity name is required',
      })
      .trim(),
    image: z.string().trim().optional(),
    description: z.string().trim().optional(),
  }),
});

const updateActivity = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    image: z.string().optional(),
    description: z.string().trim().optional(),
    userId: z
      .number()
      .int('User ID must be an integer')
      .positive('User ID must be a positive number')
      .optional(),
  }),
});

export const activityValidation = {
  createActivity,
  updateActivity,
};
