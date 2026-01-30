import { Prisma, Transaction } from '@prisma/client';
import { Request } from 'express';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { transactionSearchableFields } from './transaction.constaints';
import { ITransactionFilterRequest } from './transaction.interface';

const insertIntoDB = async (
  data: Transaction,
  req: Request
): Promise<Transaction> => {
  return prisma.$transaction(async (tx) => {
    // 1. User validation
    const user = await prisma.userDetails.findUnique({
      where: { userId: req.user?.id },
      select: { department: { select: { branchId: true } } },
    });

    if (!user) {
      throw new ApiError(404, 'User not found!');
    }

    // 2. Account validation
    const account = await tx.account.findUnique({
      where: { branchId: user.department?.branchId },
    });

    if (!account) {
      throw new ApiError(404, 'Account not found');
    }

    // 3. Withdraw balance check
    if (data.type === 'WITHDRAW' && account.balance < data.amount) {
      throw new ApiError(400, 'Insufficient balance for withdrawal');
    }

    // 4. Create transaction
    const created = await tx.transaction.create({
      data: {
        ...data,
        accountId: account.id,
        createdById: req.user?.id,
      },
    });

    // 5. Update account balance
    await tx.account.update({
      where: { id: account.id },
      data: {
        balance:
          data.type === 'DEPOSIT'
            ? { increment: data.amount }
            : { decrement: data.amount },
      },
    });

    return created;
  });
};

const getAllFromDB = async (
  filters: ITransactionFilterRequest,
  options: IPaginationOptions,
  req: Request
): Promise<IGenericResponse<Transaction[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, branchId, ...filterData } = filters;
  const andConditions = [];

  const user = await prisma.userDetails.findUnique({
    where: { userId: req.user?.id },
    select: { department: { select: { branchId: true } } },
  });

  if (!user) {
    throw new ApiError(404, 'User not found!');
  }

  if (searchTerm) {
    andConditions.push({
      OR: transactionSearchableFields.map((field) => {
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

  if (branchId) {
    andConditions.push({
      branchId: Number(branchId),
    });
  } else if (user.department?.branchId) {
    andConditions.push({
      branchId: user.department.branchId,
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereConditions: Prisma.TransactionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.transaction.findMany({
    where: whereConditions,
    include: {
      requestedBy: {
        select: {
          name: true,
        },
      },
      company: {
        select: {
          name: true,
        },
      },
      branch: {
        select: {
          name: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
          user: {
            select: {
              role: true,
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: 'desc',
          },
  });

  const total = await prisma.transaction.count({
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

const getByIdFromDB = async (id: number): Promise<Transaction | null> => {
  const result = await prisma.transaction.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Transaction>,
  req: Request
): Promise<Transaction | null> => {
  const transactionId = parseInt(id);

  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!existing) {
    throw new ApiError(404, 'Transaction not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Reverse old transaction
    if (existing.type === 'DEPOSIT') {
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { decrement: existing.amount },
        },
      });
    } else {
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: existing.amount },
        },
      });
    }

    // Step 2: Prepare updated values
    const newType = payload.type || existing.type;
    const newAmount = payload.amount ?? existing.amount;

    // Step 3: Get current balance after reversal
    const account = await tx.account.findUnique({
      where: { id: existing.accountId },
    });

    if (!account) {
      throw new ApiError(404, 'Account not found');
    }

    // Step 4: Simulate applying new transaction
    let simulatedBalance = account.balance;
    if (newType === 'DEPOSIT') {
      simulatedBalance += newAmount;
    } else {
      simulatedBalance -= newAmount;
    }

    // Step 5: Prevent negative balance
    if (simulatedBalance < 0) {
      throw new ApiError(400, 'Insufficient balance for updated transaction');
    }

    // Step 6: Update transaction
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        ...payload,
        createdById: req?.user?.id,
      },
    });

    // Step 7: Apply new effect
    if (newType === 'DEPOSIT') {
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: newAmount },
        },
      });
    } else {
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { decrement: newAmount },
        },
      });
    }

    return updated;
  });

  return result;
};

const deleteFromDB = async (id: string): Promise<Transaction> => {
  const transactionId = parseInt(id);

  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!existing) {
    throw new ApiError(404, 'Transaction not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Delete the transaction
    const deleted = await tx.transaction.delete({
      where: { id: transactionId },
    });

    // Step 2: Reverse the amount from the account
    if (deleted.type === 'DEPOSIT') {
      await tx.account.update({
        where: { id: deleted.accountId },
        data: { balance: { decrement: deleted.amount } },
      });
    } else {
      await tx.account.update({
        where: { id: deleted.accountId },
        data: { balance: { increment: deleted.amount } },
      });
    }

    return deleted;
  });

  return result;
};

export const TransactionService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
};
