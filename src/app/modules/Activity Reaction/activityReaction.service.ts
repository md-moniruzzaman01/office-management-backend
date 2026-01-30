import { ActivityReaction, Prisma } from '@prisma/client';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { activityReactionSearchableFields } from './activityReaction.constaints';
import { IActivityReactionFilterRequest } from './activityReaction.interface';

const insertIntoDB = async (
  data: ActivityReaction
): Promise<ActivityReaction> => {
  const result = await prisma.activityReaction.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: IActivityReactionFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<ActivityReaction[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: activityReactionSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.ActivityReactionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.activityReaction.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: 'desc',
          },
  });

  const total = await prisma.activityReaction.count({
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

const getByIdFromDB = async (id: number): Promise<ActivityReaction | null> => {
  const result = await prisma.activityReaction.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<ActivityReaction>
): Promise<ActivityReaction | null> => {
  const result = await prisma.activityReaction.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<ActivityReaction> => {
  const result = await prisma.activityReaction.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const ActivityReactionService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
