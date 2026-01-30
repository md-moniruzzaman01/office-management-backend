import { Holiday } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { holidayFilterableFields } from './holiday.constaints';
import { HolidayService } from './holiday.service';

const createHoliday = catchAsync(async (req: Request, res: Response) => {
  const result = await HolidayService.insertIntoDB(req.body);
  sendResponse<Holiday>(res, {
    statusCode: 200,
    success: true,
    message: 'Holiday added successfully!',
    data: result,
  });
});

const getSingleHoliday = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await HolidayService.getByIdFromDB(id);
  sendResponse<Holiday>(res, {
    statusCode: 200,
    success: true,
    message: 'Holiday fetched successfully!',
    data: result,
  });
});

const getAllHolidays = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, holidayFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await HolidayService.getAllFromDB(filters, paginationOptions);
  sendResponse<Holiday[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Holiday fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateHoliday = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await HolidayService.updateOneInDB(id, updatedData);
  sendResponse<Holiday>(res, {
    statusCode: 200,
    success: true,
    message: 'Holiday updated successfully!',
    data: result,
  });
});

const deleteHoliday = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await HolidayService.deleteFromDB(id);
  sendResponse<Holiday>(res, {
    statusCode: 200,
    success: true,
    message: 'Holiday deleted successfully!',
    data: result,
  });
});

export const ServiceHolidayController = {
  createHoliday,
  getSingleHoliday,
  getAllHolidays,
  updateHoliday,
  deleteHoliday,
};
