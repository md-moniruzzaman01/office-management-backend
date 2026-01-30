import { Account, Prisma } from '@prisma/client';
import { Request } from 'express';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { accountSearchableFields } from './account.constaints';
import { IAccountFilterRequest } from './account.interface';

const insertIntoDB = async (data: Account): Promise<Account> => {
  const isExistAccount = await prisma.account.findUnique({
    where: {
      branchId: data.branchId,
    },
  });

  if (isExistAccount) {
    throw new ApiError(409, 'An account already exists for this branch!');
  }

  const result = await prisma.account.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: IAccountFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<Account[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: accountSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.AccountWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.account.findMany({
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
      balance: true,
      createdAt: true,
      updatedAt: true,
      branchId: true,
      id: true,

      branch: {
        select: {
          name: true,
          address: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.account.count({
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

const getByIdFromDB = async (id: number): Promise<Account | null> => {
  const result = await prisma.account.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Account>
): Promise<Account | null> => {
  const result = await prisma.account.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<Account> => {
  const result = await prisma.account.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (!result) {
    throw new ApiError(400, 'Account not found');
  }
  return result;
};

const getAccountsDetailsFromDB = async (
  req: Request,
  filters: IAccountFilterRequest
) => {
  const { branchId, ...filterData } = filters;

  const user = await prisma.userDetails.findUnique({
    where: { userId: req.user?.id },
    select: { department: { select: { branchId: true } } },
  });

  if (!user) {
    throw new ApiError(404, 'User not found!');
  }

  const effectiveBranchId = branchId || user.department?.branchId;

  const account = await prisma.account.findUnique({
    where: { branchId: Number(effectiveBranchId) },
    include: {
      branch: {
        select: {
          name: true,
          id: true,
          company: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      },
    },
  });

  if (!account) {
    throw new ApiError(404, 'Account not found!');
  }

  // Existing queries
  const depositCount = await prisma.transaction.count({
    where: {
      type: 'DEPOSIT',
      accountId: account.id,
    },
  });

  const totalAmount = await prisma.account.findUnique({
    where: { id: account.id },
    select: {
      balance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const depositAmount = await prisma.transaction.aggregate({
    where: {
      type: 'DEPOSIT',
      accountId: account.id,
    },
    _sum: {
      amount: true,
    },
    _avg: {
      amount: true,
    },
    _max: {
      amount: true,
    },
  });

  const withdrawCount = await prisma.transaction.count({
    where: {
      type: 'WITHDRAW',
      accountId: account.id,
    },
  });

  const withdrawAmount = await prisma.transaction.aggregate({
    where: {
      type: 'WITHDRAW',
      accountId: account.id,
    },
    _sum: {
      amount: true,
    },
    _avg: {
      amount: true,
    },
    _max: {
      amount: true,
    },
  });

  // Monthly transaction summary for charts
  const monthlyData = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      accountId: account.id,
      createdAt: {
        gte: new Date(new Date().getFullYear(), 0, 1), // This year
      },
    },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  // FIXED: Replace raw query with Prisma query for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Instead of raw SQL, use Prisma's regular query
  const dailyTransactions = await prisma.transaction.findMany({
    where: {
      accountId: account.id,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      type: true,
      amount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Define a type for the accumulator object
  type DailyTransactionSummary = {
    date: string;
    type: string;
    total_amount: number;
    transaction_count: number;
  };

  const processedDailyData = dailyTransactions.reduce<
    Record<string, DailyTransactionSummary>
  >((acc, transaction) => {
    const date = transaction.createdAt.toISOString().split('T')[0];
    const key = `${date}-${transaction.type}`;

    if (!acc[key]) {
      acc[key] = {
        date,
        type: transaction.type,
        total_amount: 0,
        transaction_count: 0,
      };
    }

    acc[key].total_amount += transaction.amount;
    acc[key].transaction_count += 1;

    return acc;
  }, {});

  const dailyTransactionsArray = Object.values(processedDailyData);

  // Transaction frequency analysis
  const transactionFrequency = await prisma.transaction.groupBy({
    by: ['type'],
    where: { accountId: account.id },
    _count: {
      id: true,
    },
    _sum: {
      amount: true,
    },
  });

  // Last transaction info
  const lastTransaction = await prisma.transaction.findFirst({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
    select: {
      type: true,
      amount: true,
      createdAt: true,
      note: true,
    },
  });

  // This month's activity
  const currentMonth = new Date();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );

  const thisMonthActivity = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      accountId: account.id,
      createdAt: {
        gte: firstDayOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    // Existing data
    branch: account?.branch,
    depositAmount,
    depositCount,
    withdrawAmount,
    withdrawCount,
    totalAmount,

    monthlyData,
    dailyTransactions: dailyTransactionsArray, // Now using processed data
    transactionFrequency,
    lastTransaction,
    thisMonthActivity,

    // Calculated insights
    insights: {
      totalTransactions: depositCount + withdrawCount,
      netFlow:
        (depositAmount._sum.amount || 0) - (withdrawAmount._sum.amount || 0),
      averageDeposit: depositAmount._avg.amount || 0,
      averageWithdraw: withdrawAmount._avg.amount || 0,
      largestDeposit: depositAmount._max.amount || 0,
      largestWithdraw: withdrawAmount._max.amount || 0,
    },
  };
};

export const AccountService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
  getAccountsDetailsFromDB,
};
