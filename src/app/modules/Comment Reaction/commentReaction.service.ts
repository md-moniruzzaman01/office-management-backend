import { CommentReaction, Prisma } from '@prisma/client';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { commentReactionSearchableFields } from './commentReaction.constaints';
import { ICommentReactionFilterRequest } from './commentReaction.interface';

const insertIntoDB = async (
  data: CommentReaction
): Promise<CommentReaction> => {
  const result = await prisma.commentReaction.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: ICommentReactionFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<CommentReaction[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: commentReactionSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.CommentReactionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.commentReaction.findMany({
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

  const total = await prisma.commentReaction.count({
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

const getByIdFromDB = async (id: number): Promise<CommentReaction | null> => {
  const result = await prisma.commentReaction.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<CommentReaction>
): Promise<CommentReaction | null> => {
  const result = await prisma.commentReaction.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<CommentReaction> => {
  const result = await prisma.commentReaction.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const CommentReactionService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
