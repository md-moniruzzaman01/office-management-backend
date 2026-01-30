import { Leave } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { leaveApplicationFilterableFields } from './leaveApplication.constaints';
import { LeaveFrontendSafe } from './leaveApplication.interface';
import { LeaveApplicationService } from './leaveApplication.service';

const createLeaveApplication = catchAsync(
  async (req: Request, res: Response) => {
    const mainData = { ...req.body, userId: req?.user?.id };
    const result = await LeaveApplicationService.insertIntoDB(mainData);
    sendResponse<Leave>(res, {
      statusCode: 200,
      success: true,
      message: 'Leave application submitted successfully!',
      data: result,
    });
  }
);

const getSingleLeaveApplication = catchAsync(
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await LeaveApplicationService.getByIdFromDB(id);
    sendResponse<Leave>(res, {
      statusCode: 200,
      success: true,
      message: 'Leave application fetched successfully!',
      data: result,
    });
  }
);

const getAllLeaveApplications = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, leaveApplicationFilterableFields);
    const paginationOptions = pick(req.query, paginationFields);
    const isAll = true;
    const result = await LeaveApplicationService.getAllFromDB(
      filters,
      paginationOptions,
      req,
      isAll
    );
    sendResponse<LeaveFrontendSafe[]>(res, {
      statusCode: 200,
      success: true,
      message: 'Leave applications fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  }
);
const getPersonalLeaveApplications = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, leaveApplicationFilterableFields);
    const paginationOptions = pick(req.query, paginationFields);
    const isAll = false;
    const result = await LeaveApplicationService.getAllFromDB(
      filters,
      paginationOptions,
      req,
      isAll
    );
    sendResponse<LeaveFrontendSafe[]>(res, {
      statusCode: 200,
      success: true,
      message: 'Leave applications fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  }
);

const updateLeaveApplication = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const updatedData = req.body;

    const result = await LeaveApplicationService.updateOneInDB(id, updatedData);
    sendResponse<Leave>(res, {
      statusCode: 200,
      success: true,
      message: 'Leave application updated successfully!',
      data: result,
    });
  }
);

const deleteLeaveApplication = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await LeaveApplicationService.deleteFromDB(id);
    sendResponse<Leave>(res, {
      statusCode: 200,
      success: true,
      message: 'Leave application deleted successfully!',
      data: result,
    });
  }
);

export const ServiceLeaveApplicationController = {
  createLeaveApplication,
  getSingleLeaveApplication,
  getAllLeaveApplications,
  updateLeaveApplication,
  deleteLeaveApplication,
  getPersonalLeaveApplications,
};
