import z from 'zod';

const createComment = z.object({
  body: z.object({
    activityId: z.number({
      required_error: 'Activity ID is required',
    }),
    content: z
      .string({
        required_error: 'Comment content is required',
      })
      .min(1, 'Comment content cannot be empty')
      .max(500, 'Comment content cannot exceed 500 characters'),
  }),
});

const updateComment = z.object({
  body: z.object({
    activityId: z.number().optional(),
    content: z
      .string()
      .min(1, 'Comment content cannot be empty')
      .max(500, 'Comment content cannot exceed 500 characters')
      .optional(),
  }),
});

export const commentValidation = {
  createComment,
  updateComment,
};
