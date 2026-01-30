import { Branch } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { branchFilterableFields } from './branch.constaints';
import { BranchService } from './branch.service';

const createBranch = catchAsync(async (req: Request, res: Response) => {
  const result = await BranchService.insertIntoDB(req.body);
  sendResponse<Branch>(res, {
    statusCode: 200,
    success: true,
    message: 'Branch added successfully!',
    data: result,
  });
});

const getSingleBranch = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await BranchService.getByIdFromDB(id);
  sendResponse<Branch>(res, {
    statusCode: 200,
    success: true,
    message: 'Branch fetched successfully!',
    data: result,
  });
});

const getAllBranches = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, branchFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await BranchService.getAllFromDB(
    filters,
    paginationOptions,
    req
  );
  sendResponse<Branch[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Branch fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateBranch = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await BranchService.updateOneInDB(id, updatedData);
  sendResponse<Branch>(res, {
    statusCode: 200,
    success: true,
    message: 'Branch updated successfully!',
    data: result,
  });
});

const deleteBranch = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await BranchService.deleteFromDB(id);
  sendResponse<Branch>(res, {
    statusCode: 200,
    success: true,
    message: 'Branch deleted successfully!',
    data: result,
  });
});

export const ServiceBranchController = {
  createBranch,
  getSingleBranch,
  getAllBranches,
  updateBranch,
  deleteBranch,
};
