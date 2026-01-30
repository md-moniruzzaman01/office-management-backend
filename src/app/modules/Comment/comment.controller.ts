import { Comment } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { commentFilterableFields } from './comment.constaints';
import { CommentService } from './comment.service';

const createComment = catchAsync(async (req: Request, res: Response) => {
  const mainData = { ...req.body, userId: req?.user?.id };
  const result = await CommentService.insertIntoDB(mainData);
  sendResponse<Comment>(res, {
    statusCode: 200,
    success: true,
    message: 'Comment submitted successfully!',
    data: result,
  });
});

const getSingleComment = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await CommentService.getByIdFromDB(id);
  sendResponse<Comment>(res, {
    statusCode: 200,
    success: true,
    message: 'Comment fetched successfully!',
    data: result,
  });
});

const getAllComment = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, commentFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await CommentService.getAllFromDB(filters, paginationOptions);
  sendResponse<Comment[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Comment fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await CommentService.updateOneInDB(id, updatedData);
  sendResponse<Comment>(res, {
    statusCode: 200,
    success: true,
    message: 'Comment updated successfully!',
    data: result,
  });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await CommentService.deleteFromDB(id);
  sendResponse<Comment>(res, {
    statusCode: 200,
    success: true,
    message: 'Comment deleted successfully!',
    data: result,
  });
});

export const CommentController = {
  createComment,
  getSingleComment,
  getAllComment,
  updateComment,
  deleteComment,
};
