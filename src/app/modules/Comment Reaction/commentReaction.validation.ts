import z from 'zod';

const createCommentReaction = z.object({
  body: z.object({
    commentId: z.number({
      required_error: 'Comment ID is required',
    }),

    type: z.enum(['LOVE']),
  }),
});

const updateCommentReaction = z.object({
  body: z.object({
    type: z.enum(['LOVE']),
  }),
});

export const commentReactionValidation = {
  createCommentReaction,
  updateCommentReaction,
};
