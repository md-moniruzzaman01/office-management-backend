import { Department, Prisma } from '@prisma/client';
import { Request } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { getCurrentUser } from '../../../shared/getCurrentUser';
import prisma from '../../../shared/prisma';
import { departmentSearchableFields } from './department.constaints';
import { IDepartmentFilterRequest } from './department.interface';

const insertIntoDB = async (data: Department): Promise<Department> => {
  // Supervisor er existence check
  if (data.supervisorId) {
    const existingSupervisor = await prisma.department.findFirst({
      where: { supervisorId: data.supervisorId }, // Supervisor already assigned kina check
    });

    if (existingSupervisor) {
      throw new ApiError(
        400,
        `This user is already a supervisor in the "${existingSupervisor.name}" department.`
      );
    }
  }
  const branch = await prisma.branch.findUnique({
    where: { id: data.branchId },
  });

  if (!branch) {
    throw new ApiError(404, 'Branch not found!');
  }

  // Department create
  const result = await prisma.department.create({ data });

  // Supervisor er department update
  if (data.supervisorId) {
    await prisma.userDetails.update({
      where: { id: data.supervisorId },
      data: { departmentId: result.id },
    });
  }

  return result;
};

const getAllFromDB = async (
  filters: IDepartmentFilterRequest,
  options: IPaginationOptions,
  req: Request
): Promise<IGenericResponse<Department[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, branchId, ...filterData } = filters;

  const andConditions = [];

  const currentUser = await getCurrentUser(req);

  const userRole = currentUser?.user.role;

  // if (userRole === ENUM_USER_ROLE.HR) {
  //   if (currentUser?.department?.branch?.companyId) {
  //     andConditions.push({
  //       branch: {
  //         companyId: currentUser.department.branch.companyId,
  //       },
  //     });
  //   }
  // }

  if (userRole === ENUM_USER_ROLE.EMPLOYEE) {
    if (currentUser?.department?.id) {
      andConditions.push({
        id: currentUser.department.id,
      });
    } else {
      return { meta: { page: 0, limit: 0, total: 0 }, data: [] };
    }
  }

  if (userRole === ENUM_USER_ROLE.INCHARGE) {
    if (currentUser?.department?.branchId) {
      andConditions.push({
        branchId: currentUser.department.branchId,
      });
    }
  }

  if (userRole === ENUM_USER_ROLE.MANAGER) {
    if (currentUser?.department?.id) {
      andConditions.push({
        branch: {
          companyId: currentUser.department.branch.companyId,
        },
      });
    }
  }

  if (searchTerm) {
    andConditions.push({
      OR: departmentSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (branchId) {
    andConditions.push({
      branchId: parseInt(branchId), // Ensure it's a number
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereConditions: Prisma.DepartmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.department.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: 'desc',
          },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      branchId: true,
      branch: {
        select: {
          name: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
      supervisor: true,
      supervisorId: true,
      workingTimeEnd: true,
      workingTimeStart: true,
      weeklyWorkingDays: true,
      yearlyLeaveCount: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  const total = await prisma.department.count({
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

const getByIdFromDB = async (id: number): Promise<Department | null> => {
  const result = await prisma.department.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      workingTimeStart: true,
      workingTimeEnd: true,
      weeklyWorkingDays: true,
      yearlyLeaveCount: true,
      supervisorId: true,
      branchId: true,
      createdAt: true,
      updatedAt: true,
      branch: {
        select: {
          id: true,
          name: true,
          address: true,
          contactNo: true,
          companyId: true,
          company: true,
        },
      },
      users: true,
      supervisor: {
        select: {
          name: true,
          designation: true,
          email: true,
          id: true,
          profileImage: true,
        },
      },
    },
  });

  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Department>
): Promise<Department | null> => {
  const departmentId = parseInt(id);

  const existingDepartment = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { branchId: true },
  });

  if (!existingDepartment) {
    throw new ApiError(404, 'Department not found.');
  }

  // 🔁 Step 3: default update
  return await prisma.department.update({
    where: { id: departmentId },
    data: payload,
  });
};

const deleteFromDB = async (id: string): Promise<Department> => {
  const result = await prisma.department.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'department not found');
  }
  return result;
};

export const DepartmentService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
