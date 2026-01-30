import { Account } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { accountFilterableFields } from './account.constaints';
import { AccountService } from './account.service';

const createAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await AccountService.insertIntoDB(req.body);
  sendResponse<Account>(res, {
    statusCode: 200,
    success: true,
    message: 'Account added successfully!',
    data: result,
  });
});
const getAccountsDetails = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, accountFilterableFields);
  const result = await AccountService.getAccountsDetailsFromDB(req, filters);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account details fetched successfully!',
    data: result,
  });
});

const getSingleAccount = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await AccountService.getByIdFromDB(id);
  sendResponse<Account>(res, {
    statusCode: 200,
    success: true,
    message: 'Account fetched successfully!',
    data: result,
  });
});

const getAllAccounts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, accountFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await AccountService.getAllFromDB(filters, paginationOptions);
  sendResponse<Account[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Account fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateAccount = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await AccountService.updateOneInDB(id, updatedData);
  sendResponse<Account>(res, {
    statusCode: 200,
    success: true,
    message: 'Account updated successfully!',
    data: result,
  });
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AccountService.deleteFromDB(id);
  sendResponse<Account>(res, {
    statusCode: 200,
    success: true,
    message: 'Account deleted successfully!',
    data: result,
  });
});

export const ServiceAccountController = {
  createAccount,
  getSingleAccount,
  getAllAccounts,
  updateAccount,
  deleteAccount,
  getAccountsDetails,
};
