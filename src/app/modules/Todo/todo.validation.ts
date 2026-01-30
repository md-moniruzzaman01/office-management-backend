import z from 'zod';
import {
  ENUM_TASK_STATUS,
  ENUM_TODO_PRIORITY_STATUS,
} from '../../../enum/todo';

const createTodo = z.object({
  body: z.object({
    title: z.string({
      required_error: 'Title is required',
    }),
    description: z.string().optional(),
    status: z
      .enum(Object.values(ENUM_TASK_STATUS) as [string, ...string[]])
      .default('PENDING'),
    priority: z
      .enum(Object.values(ENUM_TODO_PRIORITY_STATUS) as [string, ...string[]])
      .default('MEDIUM'),
    dueDate: z.coerce.date().optional(),
    assignedTo: z.array(z.number()).optional(),
  }),
});

const updateTodo = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z
      .enum(Object.values(ENUM_TASK_STATUS) as [string, ...string[]])
      .optional(),
    priority: z
      .enum(Object.values(ENUM_TODO_PRIORITY_STATUS) as [string, ...string[]])
      .optional(),
    dueDate: z.coerce.date().optional(),
    assignedTo: z.array(z.number()).optional(),
  }),
});

export const todoValidation = {
  createTodo,
  updateTodo,
};
