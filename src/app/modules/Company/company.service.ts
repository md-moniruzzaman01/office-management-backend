import { Branch, Company, Prisma } from '@prisma/client';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { companySearchableFields } from './company.constaints';
import { ICompanyFilterRequest } from './company.interface';

const insertIntoDB = async (data: Branch): Promise<Company> => {
  const result = await prisma.company.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: ICompanyFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<Company[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      OR: companySearchableFields.map((field) => ({
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

  const whereConditions: Prisma.CompanyWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.company.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
    include: {
      branches: {
        include: {
          departments: {
            include: {
              _count: {
                select: {
                  users: true, // each department's employee count
                },
              },
            },
          },
          _count: {
            select: {
              departments: true, // each branch's department count
            },
          },
        },
      },
      _count: {
        select: {
          branches: true, // company's branch count
        },
      },
    },
  });

  const formatted = result.map((company) => {
    const totalDepartments = company.branches.reduce(
      (deptSum, branch) => deptSum + branch._count.departments,
      0
    );

    const totalEmployees = company.branches.reduce((empSum, branch) => {
      const branchEmpCount = branch.departments.reduce(
        (sum, dept) => sum + dept._count.users,
        0
      );
      return empSum + branchEmpCount;
    }, 0);

    return {
      ...company,
      totalDepartments,
      totalEmployees,
    };
  });

  const total = await prisma.company.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: formatted,
  };
};

const getByIdFromDB = async (id: number): Promise<Company | null> => {
  const result = await prisma.company.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          branches: true,
        },
      },
      branches: {
        select: {
          _count: {
            select: {
              departments: true,
            },
          },
          name: true,
          address: true,
          contactNo: true,
          departments: {
            select: {
              _count: {
                select: {
                  users: true,
                },
              },
              name: true,
              supervisor: {
                select: {
                  name: true,
                  designation: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Company>
): Promise<Company | null> => {
  const result = await prisma.company.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<Company> => {
  const result = await prisma.company.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const CompanyService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
