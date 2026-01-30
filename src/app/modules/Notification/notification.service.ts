import { Notification, Prisma } from '@prisma/client';
import { Request } from 'express';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { notificationSearchableFields } from './notification.constaints';
import { INotificationFilterRequest } from './notification.interface';
import { enrichNotification } from './notification.utilities';

const insertIntoDB = async (data: Notification): Promise<Notification> => {
  const result = await prisma.notification.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: INotificationFilterRequest,
  options: IPaginationOptions,
  req: Request
): Promise<IGenericResponse<Notification[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;
  const user = req.user;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: notificationSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.NotificationWhereInput =
    andConditions.length > 0
      ? { AND: [...andConditions, { userId: user?.id }] }
      : { userId: user?.id };

  const result = await prisma.notification.findMany({
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

  const enrichedNotifications = await Promise.all(
    result.map(enrichNotification)
  );

  const total = await prisma.notification.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: enrichedNotifications,
  };
};

const getByIdFromDB = async (id: number): Promise<Notification | null> => {
  const result = await prisma.notification.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateManyInDB = async (ids: number[]): Promise<{ count: number }> => {
  const result = await prisma.notification.updateMany({
    where: {
      id: {
        in: ids,
      },
      isSeen: false, // ✅ only update if it's unseen
    },
    data: {
      isSeen: true,
    },
  });

  return result; // returns { count: number }
};

const deleteFromDB = async (id: string): Promise<Notification> => {
  const result = await prisma.notification.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const NotificationService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateManyInDB,
};
