import { Prisma, TaskStatus, Todo } from '@prisma/client';
import { Request } from 'express';
import {
  ENUM_TASK_STATUS,
  ENUM_TODO_PRIORITY_STATUS,
} from '../../../enum/todo';
import ApiError from '../../../errors/ApiError';
import { createNotification } from '../../../helpers/createNotification';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { todoSearchableFields } from './todo.constaints';
import { ITodoFilterRequest } from './todo.interface';

interface TodoCreateInput extends Omit<Todo, 'assignedTo'> {
  assignedTo: number[];
}

const insertIntoDB = async (
  data: TodoCreateInput,
  req: Request
): Promise<Todo> => {
  const { assignedTo, ...todoData } = data;

  const assignedToData = assignedTo?.length ? assignedTo : [req.user?.id];

  const result = await prisma.todo.create({
    data: {
      ...todoData,
      createdById: req.user?.id,
      assignedTo: {
        connect: assignedToData.map((id: number) => ({ id })),
      },
    },
  });

  return result;
};

const getAllFromDB = async (
  filters: ITodoFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<Todo[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, assignedTo, createdById, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: todoSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (!filterData.status) {
    andConditions.push({
      status: {
        not: TaskStatus.ARCHIVED,
      },
    });
  }

  if (assignedTo) {
    andConditions.push({
      assignedTo: { some: { id: Number(assignedTo) } },
    });
  }
  if (createdById) {
    andConditions.push({
      createdById: Number(createdById),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereConditions: Prisma.TodoWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.todo.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
          email: true,
          designation: true,
        },
      },
    },
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: 'desc',
          },
  });

  const total = await prisma.todo.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

export const getOverviewFromDB = async (req: Request) => {
  const id = req?.user?.id;

  const [
    total,
    archived,
    completed,
    pending,
    inProgress,
    highPriority,
    myTasks,
  ] = await Promise.all([
    prisma.todo.count({
      where: {
        OR: [{ createdById: id }, { assignedTo: { some: { id } } }],
        status: {
          not: ENUM_TASK_STATUS.ARCHIVED,
        },
      },
    }),

    prisma.todo.count({
      where: {
        status: ENUM_TASK_STATUS.ARCHIVED,
        OR: [{ assignedTo: { some: { id } } }],
      },
    }),

    prisma.todo.count({
      where: {
        status: ENUM_TASK_STATUS.COMPLETED,
        OR: [{ createdById: id }, { assignedTo: { some: { id } } }],
      },
    }),

    prisma.todo.count({
      where: {
        status: ENUM_TASK_STATUS.PENDING,
        OR: [{ createdById: id }, { assignedTo: { some: { id } } }],
      },
    }),

    prisma.todo.count({
      where: {
        status: ENUM_TASK_STATUS.IN_PROGRESS,
        OR: [{ createdById: id }, { assignedTo: { some: { id } } }],
      },
    }),

    prisma.todo.count({
      where: {
        priority: ENUM_TODO_PRIORITY_STATUS.HIGH,
        OR: [{ createdById: id }, { assignedTo: { some: { id } } }],
        AND: [
          { status: { not: ENUM_TASK_STATUS.COMPLETED } },
          { status: { not: ENUM_TASK_STATUS.ARCHIVED } },
        ],
      },
    }),

    prisma.todo.findMany({
      where: {
        assignedTo: { some: { id } },
        status: {
          not: ENUM_TASK_STATUS.ARCHIVED,
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
          },
        },
      },
    }),
  ]);

  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    archived,
    completed,
    pending,
    inProgress,
    highPriority,
    completionRate,
    myTasks,
  };
};

const getByIdFromDB = async (id: number): Promise<Todo | null> => {
  const result = await prisma.todo.findUnique({
    where: {
      id,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
        },
      },
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Todo> & { assignedTo?: number[] }
): Promise<Todo | null> => {
  const { assignedTo, ...restPayload } = payload;

  const updateData: Prisma.TodoUpdateInput = { ...restPayload };

  if (assignedTo && assignedTo.length > 0) {
    updateData.assignedTo = {
      set: assignedTo.map((userId) => ({ id: userId })),
    };
  }

  const result = await prisma.todo.update({
    where: {
      id: parseInt(id),
    },
    data: updateData,
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (
    result.status === ENUM_TASK_STATUS.COMPLETED ||
    result.status === ENUM_TASK_STATUS.CANCELLED
  ) {
    await createNotification({
      userId: result.createdById,
      type: 'TODO',
      referenceId: result.id,
    });
  }

  return result;
};

const deleteFromDB = async (id: string): Promise<Todo> => {
  const result = await prisma.todo.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const TodoService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
  getOverviewFromDB,
};
