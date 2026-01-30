import z from 'zod';

const createNotification = z.object({
  body: z.object({
    userId: z.number({
      required_error: 'userId is required',
    }),
    type: z.enum([
      'TODO',
      'LEAVE',
      'REQUISITION',
      'HOLIDAY',
      'EVENT',
      'ACTIVITY',
      'MESSAGE',
    ]),
    referenceId: z.number({
      required_error: 'referenceId is required',
    }),
    isSeen: z.boolean().optional(),
  }),
});

const updateNotification = z.object({
  body: z.object({
    userId: z.number().optional(),
    type: z
      .enum([
        'TODO',
        'LEAVE',
        'REQUISITION',
        'HOLIDAY',
        'EVENT',
        'ACTIVITY',
        'MESSAGE',
      ])
      .optional(),
    referenceId: z.number().optional(),
    isSeen: z.boolean().optional(),
  }),
});

export const notificationValidation = {
  createNotification,
  updateNotification,
};
