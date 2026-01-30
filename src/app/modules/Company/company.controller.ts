import { Company } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { companyFilterableFields } from './company.constaints';
import { CompanyService } from './company.service';

const createCompany = catchAsync(async (req: Request, res: Response) => {
  const result = await CompanyService.insertIntoDB(req.body);
  sendResponse<Company>(res, {
    statusCode: 200,
    success: true,
    message: 'Company added successfully!',
    data: result,
  });
});

const getSingleCompany = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await CompanyService.getByIdFromDB(id);
  sendResponse<Company>(res, {
    statusCode: 200,
    success: true,
    message: 'Company fetched successfully!',
    data: result,
  });
});

const getAllCompanies = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, companyFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await CompanyService.getAllFromDB(filters, paginationOptions);
  sendResponse<Company[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Company fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateCompany = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await CompanyService.updateOneInDB(id, updatedData);
  sendResponse<Company>(res, {
    statusCode: 200,
    success: true,
    message: 'Company updated successfully!',
    data: result,
  });
});

const deleteCompany = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await CompanyService.deleteFromDB(id);
  sendResponse<Company>(res, {
    statusCode: 200,
    success: true,
    message: 'Company deleted successfully!',
    data: result,
  });
});

export const ServiceCompanyController = {
  createCompany,
  getSingleCompany,
  getAllCompanies,
  updateCompany,
  deleteCompany,
};
