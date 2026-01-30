import { Branch, Prisma } from '@prisma/client';
import { Request } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { getCurrentUser } from '../../../shared/getCurrentUser';
import prisma from '../../../shared/prisma';
import { branchSearchableFields } from './branch.constaints';
import { IBranchFilterRequest } from './branch.interface';

const insertIntoDB = async (data: Branch): Promise<Branch> => {
  const branch = await prisma.branch.findFirst({
    where: {
      name: data?.name,
      companyId: data?.companyId,
    },
  });

  if (branch) {
    throw new ApiError(
      409,
      `Branch with name "${data?.name}" already exists for this company`
    );
  }

  const result = await prisma.branch.create({
    data,
  });

  return result;
};

const getAllFromDB = async (
  filters: IBranchFilterRequest,
  options: IPaginationOptions,
  req: Request
): Promise<IGenericResponse<Branch[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, companyId, ...filterData } = filters;

  const andConditions = [];

  const currentUser = await getCurrentUser(req);
  if (!currentUser?.user) {
    throw new ApiError(401, 'Unauthorized access');
  }

  const userRole = currentUser?.user.role;

  // if (userRole === ENUM_USER_ROLE.HR) {
  //   if (currentUser?.department?.branch?.companyId) {
  //     andConditions.push({
  //       companyId: currentUser.department.branch.companyId,
  //     });
  //   }
  // }

  if (userRole === ENUM_USER_ROLE.EMPLOYEE) {
    if (currentUser?.department?.branchId) {
      andConditions.push({
        id: currentUser.department?.branchId,
      });
    } else {
      return { meta: { page: 0, limit: 0, total: 0 }, data: [] };
    }
  }

  if (userRole === ENUM_USER_ROLE.INCHARGE) {
    if (currentUser?.department?.branchId) {
      andConditions.push({
        id: currentUser.department.branchId,
      });
    }
  }

  if (userRole === ENUM_USER_ROLE.MANAGER) {
    if (currentUser?.department?.branch?.companyId) {
      andConditions.push({
        companyId: currentUser.department.branch?.companyId,
      });
    }
  }

  if (searchTerm) {
    andConditions.push({
      OR: branchSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }
  if (companyId) {
    andConditions.push({
      companyId: parseInt(companyId),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereConditions: Prisma.BranchWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.branch.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
    include: {
      company: true,
      departments: {
        include: {
          _count: {
            select: { users: true },
          },
        },
      },
      _count: {
        select: {
          departments: true,
        },
      },
    },
  });

  const branchesWithEmployeeCount = result.map((branch) => {
    const totalEmployees = branch.departments.reduce(
      (sum, dept) => sum + (dept._count?.users || 0),
      0
    );
    return {
      ...branch,
      totalEmployees,
    };
  });

  const total = await prisma.branch.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: branchesWithEmployeeCount,
  };
};

const getByIdFromDB = async (id: number): Promise<Branch | null> => {
  const result = await prisma.branch.findUnique({
    where: {
      id,
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      departments: {
        select: {
          supervisor: {
            select: {
              name: true,
              designation: true,
            },
          },
          weeklyWorkingDays: true,
          workingTimeEnd: true,
          workingTimeStart: true,
          name: true,
          id: true,
        },
      },
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Branch>
): Promise<Branch | null> => {
  const result = await prisma.branch.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<Branch> => {
  const result = await prisma.branch.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const BranchService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
