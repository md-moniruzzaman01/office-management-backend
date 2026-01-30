import z from 'zod';

const createActivityReaction = z.object({
  body: z.object({
    activityId: z.number({
      required_error: 'Activity ID is required',
    }),

    type: z.enum(['LOVE']),
  }),
});

const updateActivityReaction = z.object({
  body: z.object({
    type: z.enum(['LOVE']),
  }),
});

export const activityReactionValidation = {
  createActivityReaction,
  updateActivityReaction,
};
