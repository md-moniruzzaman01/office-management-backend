import { Power, Prisma } from '@prisma/client';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { powerSearchableFields } from './power.constaints';
import { IPowerFilterRequest } from './power.interface';

const insertIntoDB = async (data: Power): Promise<Power> => {
  const result = await prisma.power.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: IPowerFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<Power[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: powerSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.PowerWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.power.findMany({
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

  const total = await prisma.power.count({
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

const getByIdFromDB = async (id: number): Promise<Power | null> => {
  const result = await prisma.power.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Power>
): Promise<Power | null> => {
  const result = await prisma.power.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<Power> => {
  const result = await prisma.power.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const PowerService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
