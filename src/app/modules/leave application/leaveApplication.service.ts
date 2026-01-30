import { Leave, Prisma } from '@prisma/client';
import { Request } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import ApiError from '../../../errors/ApiError';
import { createNotification } from '../../../helpers/createNotification';
import { sendEmail } from '../../../helpers/Email Service/email.service';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { getCurrentUser } from '../../../shared/getCurrentUser';
import prisma from '../../../shared/prisma';
import { LeaveStatusUpdateTemplate } from './Email Template/LeaveMailTemp';
import { leaveApplicationSearchableFields } from './leaveApplication.constaints';
import {
  ILeaveApplicationFilterRequest,
  LeaveFrontendSafe,
} from './leaveApplication.interface';

const insertIntoDB = async (data: Leave): Promise<Leave> => {
  const result = await prisma.leave.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: ILeaveApplicationFilterRequest,
  options: IPaginationOptions,
  req: Request,
  isAll?: boolean
): Promise<IGenericResponse<LeaveFrontendSafe[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;
  const requestedBy = req?.user?.id;
  const andConditions: Prisma.LeaveWhereInput[] = [];

  const currentUser = await getCurrentUser(req);

  const userRole = currentUser?.user.role;
  if (userRole === ENUM_USER_ROLE.EMPLOYEE && isAll) {
    if (currentUser?.supervisedDepartment) {
      andConditions.push({
        user: {
          departmentId: currentUser.supervisedDepartment?.id,
        },
      });
    } else {
      return { meta: { page: 0, limit: 0, total: 0 }, data: [] };
    }
  }

  // if (userRole === ENUM_USER_ROLE.HR && isAll) {
  //   if (currentUser?.department?.branch?.companyId) {
  //     andConditions.push({
  //       user: {
  //         department: {
  //           branch: {
  //             companyId: currentUser.department.branch.companyId,
  //           },
  //         },
  //       },
  //     });
  //   }
  // }

  if (userRole === ENUM_USER_ROLE.INCHARGE && isAll) {
    if (currentUser?.department?.branchId) {
      andConditions.push({
        user: {
          department: {
            branchId: currentUser.department.branchId,
          },
        },
      });
    }
  }

  if (userRole === ENUM_USER_ROLE.MANAGER && isAll) {
    if (currentUser?.department?.id) {
      andConditions.push({
        user: {
          department: {
            branch: {
              companyId: currentUser.department.id,
            },
          },
        },
      });
    }
  }

  if (searchTerm) {
    andConditions.push({
      OR: leaveApplicationSearchableFields.map((field) => {
        const fields = field.split('.');

        if (fields.length === 2) {
          return {
            [fields[0]]: {
              [fields[1]]: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          };
        }

        return {
          [field]: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        };
      }),
    });
  }

  if (Object.keys(filterData).length > 0) {
    Object.entries(filterData).forEach(([field, value]) => {
      andConditions.push({
        [field]: value,
      });
    });
  }

  if (requestedBy && !isAll) {
    andConditions.push({
      userId: Number(requestedBy),
    });
  }

  const whereConditions: Prisma.LeaveWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.leave.findMany({
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
          department: {
            select: {
              name: true,
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
            },
          },
        },
      },
    },
  });

  const safeResult = result.map(({ userId, ...rest }) => rest);

  const total = await prisma.leave.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: safeResult,
  };
};

const getByIdFromDB = async (id: number): Promise<Leave | null> => {
  const result = await prisma.leave.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          designation: true,
          department: {
            select: {
              name: true,
              branch: {
                select: {
                  company: {
                    select: {
                      padImage: true,
                    },
                  },
                },
              },
              supervisor: {
                select: {
                  name: true,
                  gender: true,
                },
              },
            },
          },
          name: true,
        },
      },
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Leave>
): Promise<Leave | null> => {
  const result = await prisma.leave.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
    include: {
      user: true,
    },
  });

  if (result.status === 'APPROVED' || result.status === 'REJECTED') {
    // 📩 Send Email
    sendEmail(
      result.user?.email,
      LeaveStatusUpdateTemplate,
      'Your Leave Request Has Been ' + result.status,
      {
        name: result?.user?.name,
        status: result.status,
        leaveType: result.type,
        from: result?.startDate?.toISOString().slice(0, 10),
        to: result?.endDate?.toISOString().slice(0, 10),
      }
    );

    // 🔔 Notification
    await createNotification({
      userId: result.userId,
      type: 'LEAVE',
      referenceId: result.id,
    });

    // ✅ Attendance Update if APPROVED
    if (result.status === 'APPROVED') {
      await prisma.attendance.updateMany({
        where: {
          fingerId: result.user.fingerId ?? undefined,
          date: {
            gte: result.startDate,
            lte: result.endDate,
          },
        },
        data: {
          status: 'LEAVE',
        },
      });
    }
  }

  return result;
};

const deleteFromDB = async (id: string): Promise<Leave> => {
  const result = await prisma.leave.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'user not found');
  }
  return result;
};

export const LeaveApplicationService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
