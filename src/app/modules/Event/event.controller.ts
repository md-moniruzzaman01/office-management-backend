import { DepartmentEvent } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { departmentEventFilterableFields } from './event.constaints';
import { DepartmentEventService } from './event.service';

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentEventService.insertIntoDB(req.body);
  sendResponse<DepartmentEvent>(res, {
    statusCode: 200,
    success: true,
    message: 'Event added successfully!',
    data: result,
  });
});

const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await DepartmentEventService.getByIdFromDB(id);
  sendResponse<DepartmentEvent>(res, {
    statusCode: 200,
    success: true,
    message: 'Event fetched successfully!',
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, departmentEventFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await DepartmentEventService.getAllFromDB(
    filters,
    paginationOptions
  );
  sendResponse<DepartmentEvent[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Events fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await DepartmentEventService.updateOneInDB(id, updatedData);
  sendResponse<DepartmentEvent>(res, {
    statusCode: 200,
    success: true,
    message: 'Event updated successfully!',
    data: result,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await DepartmentEventService.deleteFromDB(id);
  sendResponse<DepartmentEvent>(res, {
    statusCode: 200,
    success: true,
    message: 'Event deleted successfully!',
    data: result,
  });
});

export const ServiceEventController = {
  createEvent,
  getSingleEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
};
