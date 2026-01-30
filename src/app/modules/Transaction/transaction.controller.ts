import { Transaction } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { transactionFilterableFields } from './transaction.constaints';
import { TransactionService } from './transaction.service';

const createTransaction = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.insertIntoDB(req.body, req);
  sendResponse<Transaction>(res, {
    statusCode: 200,
    success: true,
    message: 'Transaction added successfully!',
    data: result,
  });
});

const getSingleTransaction = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await TransactionService.getByIdFromDB(id);
  sendResponse<Transaction>(res, {
    statusCode: 200,
    success: true,
    message: 'Transaction fetched successfully!',
    data: result,
  });
});

const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, transactionFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await TransactionService.getAllFromDB(
    filters,
    paginationOptions,
    req
  );
  sendResponse<Transaction[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Transaction fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateTransaction = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await TransactionService.updateOneInDB(id, updatedData, req);
  sendResponse<Transaction>(res, {
    statusCode: 200,
    success: true,
    message: 'Transaction updated successfully!',
    data: result,
  });
});

const deleteTransaction = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await TransactionService.deleteFromDB(id);
  sendResponse<Transaction>(res, {
    statusCode: 200,
    success: true,
    message: 'Transaction deleted successfully!',
    data: result,
  });
});

export const ServiceTransactionController = {
  createTransaction,
  getSingleTransaction,
  getAllTransactions,
  updateTransaction,
  deleteTransaction,
};
