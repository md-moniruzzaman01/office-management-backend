import { Request, Response } from 'express';
//
import { paginationFields } from '../../../constants/pagination';
import { ENUM_USER_ROLE } from '../../../enum/user';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import {
  userFilterableFields,
  userFilterFieldsForDownload,
} from './user.constaints';
import { userService } from './user.services';

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.insertIntoDB(req.body, req.body.role);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'user created successfully',
    data: result,
  });
});
const insertReviewIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.insertReviewIntoDB(req.body, req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});
const AdminInsertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.insertIntoDB(req.body, ENUM_USER_ROLE.ADMIN);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'admin created successfully',
    data: result,
  });
});
const SuperAdminInsertIntoDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await userService.insertIntoDB(
      req.body,
      ENUM_USER_ROLE.SUPER_ADMIN
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'super admin created successfully',
      data: result,
    });
  }
);

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await userService.getAllFromDB(filters, options, req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'user fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});
const getMyTeamFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await userService.getMyTeamFromDB(filters, options, req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'user fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});
const getMyReceivedReviewTeamFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const parseId = parseInt(id);
    const filters = pick(req.query, userFilterableFields);
    const options = pick(req.query, paginationFields);
    const result = await userService.getMyReceivedReviewFromDB(
      filters,
      options,
      parseId
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'reviews fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  }
);

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await userService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'user fetched successfully',
    data: result,
  });
});
const getByIdForDownloadFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const parseId = parseInt(id);
    const filters = pick(req.query, userFilterFieldsForDownload);
    await userService.getByIdForDownloadFromDB(parseId, filters, res);
  }
);

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'user update successfully',
    data: result,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.deleteByIdFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});
const deleteReviewFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.deleteReviewByIdFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

export const userController = {
  insertIntoDB,
  AdminInsertIntoDB,
  SuperAdminInsertIntoDB,

  getAllFromDB,
  getByIdForDownloadFromDB,
  getByIdFromDB,
  updateOneInDB,
  deleteFromDB,
  getMyTeamFromDB,
  insertReviewIntoDB,
  getMyReceivedReviewTeamFromDB,
  deleteReviewFromDB,
};
