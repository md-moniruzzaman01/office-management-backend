import { z } from 'zod';

const requisitionTypes = [
  'HIRING',
  'ASSET',
  'TRAINING',
  'TRAVEL',
  'BUDGET',
  'OTHERS',
] as const;

const requisitionStatuses = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;

const priorityLevels = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const createRequisition = z.object({
  body: z.object({
    title: z.string({
      required_error: 'Title is required',
    }),
    description: z.string().optional(),

    status: z.enum(requisitionStatuses).optional(),
    priority: z.enum(priorityLevels).optional(),

    requestedById: z.number({ required_error: 'requestedById is required' }),
    branchId: z.number({ required_error: 'branchId is required' }),
    companyId: z.number({ required_error: 'companyId is required' }),
    departmentId: z.union([z.number(), z.null()]).optional(),

    items: z
      .array(
        z.object({
          title: z.string({ required_error: 'Item title is required' }),
          description: z.string().optional(),
          amount: z
            .number({ required_error: 'Item amount is required' })
            .positive('Amount must be positive'),
          type: z.enum(requisitionTypes, {
            required_error: 'Item type is required',
          }),
        })
      )
      .min(1, { message: 'At least one item is required' }),
  }),
});

const updateRequisition = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),

    type: z.enum(requisitionTypes).optional(),
    status: z.enum(requisitionStatuses).optional(),
    priority: z.enum(priorityLevels).optional(),

    approvedById: z.number().optional(),
    departmentId: z.union([z.number(), z.null()]).optional(),
    branchId: z.number().optional(),
    companyId: z.number().optional(),

    items: z
      .array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          amount: z.number().positive(),
          type: z.enum(requisitionTypes),
        })
      )
      .optional(),
  }),
});

export const requisitionValidation = {
  createRequisition,
  updateRequisition,
};
