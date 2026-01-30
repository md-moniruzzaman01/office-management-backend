import { DepartmentEvent, Prisma } from '@prisma/client';
import ApiError from '../../../errors/ApiError';
import { sendEmail } from '../../../helpers/Email Service/email.service';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { EventCreatedEmailTemplate } from './Email Template/EventEmailTemp';
import { departmentEventSearchableFields } from './event.constaints';
import { IDepartmentEventFilterRequest } from './event.interface';

const insertIntoDB = async (
  data: DepartmentEvent
): Promise<DepartmentEvent> => {
  const result = await prisma.departmentEvent.create({
    data,
  });

  const users = await prisma.userDetails.findMany({
    where: {
      departmentId: data.departmentId ?? undefined,
    },
  });

  for (const user of users) {
    sendEmail(
      user.email,
      EventCreatedEmailTemplate,
      `Event Updated: ${result.name}`,
      {
        name: user.name,
        eventName: result.name,
        description: result.description ?? '',
        startDate: result.startDate.toString().slice(0, 10),
        endDate: result.endDate.toString().slice(0, 10),
      }
    );
  }

  return result;
};

const getAllFromDB = async (
  filters: IDepartmentEventFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<DepartmentEvent[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: departmentEventSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.DepartmentEventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.departmentEvent.findMany({
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
      department: true,
      branch: true,
    },
  });

  const total = await prisma.departmentEvent.count({
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

const getByIdFromDB = async (id: number): Promise<DepartmentEvent | null> => {
  const result = await prisma.departmentEvent.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<DepartmentEvent>
): Promise<DepartmentEvent | null> => {
  const result = await prisma.departmentEvent.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
    include: {
      department: true,
      branch: true,
    },
  });

  const users = await prisma.userDetails.findMany({
    where: {
      departmentId: result.departmentId ?? undefined,
    },
  });

  for (const user of users) {
    sendEmail(
      user.email,
      EventCreatedEmailTemplate,
      `Event Updated: ${result.name}`,
      {
        name: user.name,
        eventName: result.name,
        description: result.description ?? '',
        startDate: result.startDate.toString().slice(0, 10),
        endDate: result.endDate.toString().slice(0, 10),
      }
    );
  }

  return result;
};

const deleteFromDB = async (id: string): Promise<DepartmentEvent> => {
  const result = await prisma.departmentEvent.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const DepartmentEventService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
