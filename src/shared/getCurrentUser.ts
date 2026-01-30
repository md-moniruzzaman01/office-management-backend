import { Request } from 'express';
import prisma from './prisma';

export const getCurrentUser = async (req: Request) => {
  const user = req.user;
  return await prisma.userDetails.findUnique({
    where: { id: user?.id },
    select: {
      id: true,
      supervisedDepartment: true,
      department: {
        select: {
          id: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              companyId: true,
            },
          },
        },
      },
      user: {
        select: {
          role: true,
        },
      },
    },
  });
};
