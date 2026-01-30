import { Activity, Prisma } from '@prisma/client';
import { ENUM_USER_ROLE } from '../../../enum/user';
import ApiError from '../../../errors/ApiError';
import { createNotification } from '../../../helpers/createNotification';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { activitySearchableFields } from './activity.constaints';
import { IActivityFilterRequest } from './activity.interface';

const insertIntoDB = async (data: Activity): Promise<Activity> => {
  const result = await prisma.activity.create({
    data,
    include: {
      user: {
        include: {
          user: true,
        },
      },
    },
  });

  const role = result.user.user.role;

  if (Object.keys(ENUM_USER_ROLE).includes(role)) {
    // Fetch all userDetails
    const allUsers = await prisma.userDetails.findMany({
      select: { id: true },
    });

    for (const user of allUsers) {
      await createNotification({
        userId: user.id,
        type: 'ACTIVITY',
        referenceId: result.id,
      });
    }
  }

  return result;
};

const getAllFromDB = async (
  filters: IActivityFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<Activity[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: activitySearchableFields.map((field) => ({
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

  const whereConditions: Prisma.ActivityWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.activity.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: 'desc',
          },
    include: {
      user: {
        include: {
          department: true,
        },
      },
      reactions: true,
      comments: true,
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
  });

  const total = await prisma.activity.count({
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

const getByIdFromDB = async (id: number): Promise<Activity | null> => {
  const result = await prisma.activity.findUnique({
    where: {
      id,
    },
    include: {
      comments: {
        include: {
          _count: {
            select: {
              reactions: true,
            },
          },
          reactions: {
            include: {
              user: {
                include: {
                  department: true,
                },
              },
            },
          },
          user: {
            include: {
              department: true,
            },
          },
        },
      },
      reactions: {
        include: {
          user: {
            include: {
              department: true,
            },
          },
        },
      },
      _count: {
        select: {
          reactions: true,
        },
      },
      user: true,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Activity>
): Promise<Activity | null> => {
  const result = await prisma.activity.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<Activity> => {
  const activityId = parseInt(id);

  // Get all comment IDs related to the activity
  const comments = await prisma.comment.findMany({
    where: { activityId },
    select: { id: true },
  });
  const commentIds = comments.map((comment) => comment.id);

  // Delete related reactions and comments FIRST
  await prisma.activityReaction.deleteMany({
    where: { activityId },
  });

  if (commentIds.length > 0) {
    await prisma.commentReaction.deleteMany({
      where: {
        commentId: { in: commentIds },
      },
    });
  }

  await prisma.comment.deleteMany({
    where: { activityId },
  });

  // Now safely delete the activity
  const result = await prisma.activity.delete({
    where: { id: activityId },
    include: {
      comments: true,
      reactions: true,
    },
  });

  if (!result) {
    throw new ApiError(400, 'Activity not found');
  }

  return result;
};

export const ActivityService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
