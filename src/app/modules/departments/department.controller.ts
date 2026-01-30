import { Department } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { departmentFilterableFields } from './department.constaints';
import { DepartmentService } from './department.service';

const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.insertIntoDB(req.body);
  sendResponse<Department>(res, {
    statusCode: 200,
    success: true,
    message: 'Department created successfully!',
    data: result,
  });
});
const getSingleDepartment = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await DepartmentService.getByIdFromDB(id);
  sendResponse<Department>(res, {
    statusCode: 200,
    success: true,
    message: 'Department fetched successfully !',
    data: result,
  });
});

const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, departmentFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await DepartmentService.getAllFromDB(
    filters,
    paginationOptions,
    req
  );
  sendResponse<Department[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Departments fetched successfully !',
    meta: result.meta,
    data: result.data,
  });
});

const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedCategory = req.body;
  const result = await DepartmentService.updateOneInDB(id, updatedCategory);
  sendResponse<Department>(res, {
    statusCode: 200,
    success: true,
    message: 'Department update successfully !',
    data: result,
  });
});

const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await DepartmentService.deleteFromDB(id);
  sendResponse<Department>(res, {
    statusCode: 200,
    success: true,
    message: 'Department deleted successfully !',
    data: result,
  });
});

export const ServiceDepartmentController = {
  createDepartment,
  getSingleDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
};
