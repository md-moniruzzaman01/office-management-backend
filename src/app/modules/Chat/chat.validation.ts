import z from 'zod';

// Validation for creating a message
const createMessage = z.object({
  body: z.object({
    content: z
      .string({
        required_error: 'Message content is required',
      })
      .min(1, 'Message content cannot be empty'),

    senderId: z.number({
      required_error: 'Sender ID is required',
    }),

    receiverId: z.number().optional(), // Optional for group chats

    chatRoomId: z.number().optional(), // Optional for threads or groups
  }),
});

const updateMessage = z.object({
  body: z
    .object({
      content: z.string().optional(),
      receiverId: z.number().optional(),
      chatRoomId: z.number().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required to update a message',
    }),
});

export const messageValidation = {
  createMessage,
  updateMessage,
};
