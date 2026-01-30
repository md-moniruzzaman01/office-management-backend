import { Prisma, Requisition, RequisitionItem } from '@prisma/client';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { ENUM_USER_ROLE } from '../../../enum/user';
import ApiError from '../../../errors/ApiError';
import { createNotification } from '../../../helpers/createNotification';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { requisitionSearchableFields } from './requisition.constaints';
import { IRequisitionFilterRequest } from './requisition.interface';

type RequisitionWithItemsInput = Omit<
  Prisma.RequisitionUncheckedCreateInput,
  'items'
> & {
  items: Prisma.RequisitionItemUncheckedCreateInput[];
};

export const insertIntoDB = async (
  data: RequisitionWithItemsInput,
  req: Request
): Promise<Requisition> => {
  const { items, ...requisitionData } = data;

  const result = await prisma.requisition.create({
    data: {
      ...requisitionData,
      createdById: req.user?.id,
      items: {
        create: items,
      },
    },
    include: {
      items: true,
    },
  });

  return result;
};

const getAllFromDB = async (
  filters: IRequisitionFilterRequest,
  options: IPaginationOptions,
  user: JwtPayload
): Promise<IGenericResponse<Requisition[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;
  const id = user?.id;
  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: requisitionSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const privilegedRoles = [
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.HR,
  ];

  if (!privilegedRoles.includes(user.role)) {
    andConditions.push({
      OR: [{ requestedById: parseInt(id) }, { createdById: parseInt(id) }],
    });
  }

  const whereConditions: Prisma.RequisitionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.requisition.findMany({
    where: whereConditions,
    include: {
      requestedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      branch: {
        select: {
          name: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
      items: true,
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: 'desc',
          },
  });

  const total = await prisma.requisition.count({
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

const getByIdFromDB = async (id: number): Promise<Requisition | null> => {
  const result = await prisma.requisition.findUnique({
    where: {
      id,
    },
    include: {
      requestedBy: {
        select: {
          name: true,
          email: true,
          id: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
          id: true,
        },
      },
      branch: {
        select: {
          name: true,
          id: true,
        },
      },
      department: {
        select: {
          name: true,
          id: true,
        },
      },
      items: true,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Requisition> & { items?: RequisitionItem[] },
  req: Request
): Promise<Requisition | null> => {
  const requisitionId = parseInt(id);
  const user = req?.user;

  const { items, ...restPayload } = payload;

  // Start a transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update main requisition
    const updatedRequisition = await tx.requisition.update({
      where: { id: requisitionId },
      data: {
        ...restPayload,
        createdById: user?.id,
      },
    });

    // 2. If items exist, remove old and insert new ones
    if (items && items.length > 0) {
      // Delete old items
      await tx.requisitionItem.deleteMany({
        where: { requisitionId },
      });

      // Create new items
      await tx.requisitionItem.createMany({
        data: items.map((item) => ({
          ...item,
          requisitionId,
        })),
      });
    }

    return updatedRequisition;
  });
  if (result.status === 'APPROVED' || result.status === 'REJECTED') {
    await createNotification({
      userId: result.requestedById,
      type: 'REQUISITION',
      referenceId: result.id,
    });
  }
  return result;
};

const deleteFromDB = async (id: string): Promise<Requisition> => {
  const result = await prisma.requisition.delete({
    where: {
      id: parseInt(id),
    },
    include: {
      items: true,
    },
  });

  if (!result) {
    throw new ApiError(400, 'Requisition not found');
  }

  return result;
};

export const RequisitionService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
