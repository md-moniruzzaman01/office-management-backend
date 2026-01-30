import { Requisition } from '@prisma/client';
import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { requisitionFilterableFields } from './requisition.constaints';
import { RequisitionService } from './requisition.service';

const createRequisition = catchAsync(async (req: Request, res: Response) => {
  const result = await RequisitionService.insertIntoDB(req.body, req);
  sendResponse<Requisition>(res, {
    statusCode: 200,
    success: true,
    message: 'Requisition created successfully!',
    data: result,
  });
});

const getSingleRequisition = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await RequisitionService.getByIdFromDB(id);
  sendResponse<Requisition>(res, {
    statusCode: 200,
    success: true,
    message: 'Requisition fetched successfully!',
    data: result,
  });
});

const getAllRequisition = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, requisitionFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await RequisitionService.getAllFromDB(
    filters,
    paginationOptions,
    req.user as JwtPayload
  );
  sendResponse<Requisition[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Requisition fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateRequisition = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;

  const result = await RequisitionService.updateOneInDB(id, updatedData, req);
  sendResponse<Requisition>(res, {
    statusCode: 200,
    success: true,
    message: 'Requisition updated successfully!',
    data: result,
  });
});

const deleteRequisition = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await RequisitionService.deleteFromDB(id);
  sendResponse<Requisition>(res, {
    statusCode: 200,
    success: true,
    message: 'Requisition deleted successfully!',
    data: result,
  });
});

export const ServiceRequisitionController = {
  createRequisition,
  getSingleRequisition,
  getAllRequisition,
  updateRequisition,
  deleteRequisition,
};
