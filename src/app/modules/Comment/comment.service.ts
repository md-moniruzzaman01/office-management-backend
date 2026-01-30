import { Comment, Prisma } from '@prisma/client';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { commentSearchableFields } from './comment.constaints';
import { ICommentFilterRequest } from './comment.interface';

const insertIntoDB = async (data: Comment): Promise<Comment> => {
  const result = await prisma.comment.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: ICommentFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<Comment[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: commentSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.CommentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.comment.findMany({
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

  const total = await prisma.comment.count({
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

const getByIdFromDB = async (id: number): Promise<Comment | null> => {
  const result = await prisma.comment.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Comment>
): Promise<Comment | null> => {
  const result = await prisma.comment.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<Comment> => {
  const commentId = parseInt(id);

  // Delete all comment reactions first
  await prisma.commentReaction.deleteMany({
    where: { commentId },
  });

  // Now delete the comment
  const result = await prisma.comment.delete({
    where: { id: commentId },
  });

  if (!result) {
    throw new ApiError(400, 'Comment not found');
  }

  return result;
};

export const CommentService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
