import { Power } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { powerFilterableFields } from './power.constaints';
import { PowerService } from './power.service';

const createPower = catchAsync(async (req: Request, res: Response) => {
  const result = await PowerService.insertIntoDB(req.body);
  sendResponse<Power>(res, {
    statusCode: 200,
    success: true,
    message: 'Power added successfully!',
    data: result,
  });
});

const getSinglePower = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await PowerService.getByIdFromDB(id);
  sendResponse<Power>(res, {
    statusCode: 200,
    success: true,
    message: 'Power fetched successfully!',
    data: result,
  });
});

const getAllPowers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, powerFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await PowerService.getAllFromDB(filters, paginationOptions);
  sendResponse<Power[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Power fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updatePower = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await PowerService.updateOneInDB(id, updatedData);
  sendResponse<Power>(res, {
    statusCode: 200,
    success: true,
    message: 'Power updated successfully!',
    data: result,
  });
});

const deletePower = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await PowerService.deleteFromDB(id);
  sendResponse<Power>(res, {
    statusCode: 200,
    success: true,
    message: 'Power deleted successfully!',
    data: result,
  });
});

export const ServicePowerController = {
  createPower,
  getSinglePower,
  getAllPowers,
  updatePower,
  deletePower,
};
