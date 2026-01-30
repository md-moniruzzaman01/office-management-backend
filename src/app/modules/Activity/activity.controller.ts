import { Activity } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { activityFilterableFields } from './activity.constaints';
import { ActivityService } from './activity.service';

const createActivity = catchAsync(async (req: Request, res: Response) => {
  const mainData = { ...req.body, userId: req?.user?.id };
  const result = await ActivityService.insertIntoDB(mainData);
  sendResponse<Activity>(res, {
    statusCode: 200,
    success: true,
    message: 'Activity created successfully!',
    data: result,
  });
});

const getSingleActivity = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await ActivityService.getByIdFromDB(id);
  sendResponse<Activity>(res, {
    statusCode: 200,
    success: true,
    message: 'Activity fetched successfully!',
    data: result,
  });
});

const getAllActivity = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, activityFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await ActivityService.getAllFromDB(filters, paginationOptions);
  sendResponse<Activity[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Activity fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateActivity = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await ActivityService.updateOneInDB(id, updatedData);
  sendResponse<Activity>(res, {
    statusCode: 200,
    success: true,
    message: 'Activity updated successfully!',
    data: result,
  });
});

const deleteActivity = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ActivityService.deleteFromDB(id);
  sendResponse<Activity>(res, {
    statusCode: 200,
    success: true,
    message: 'Activity deleted successfully!',
    data: result,
  });
});

export const ServiceActivityController = {
  createActivity,
  getSingleActivity,
  getAllActivity,
  updateActivity,
  deleteActivity,
};
