import { CommentReaction } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { commentReactionFilterableFields } from './commentReaction.constaints';
import { CommentReactionService } from './commentReaction.service';

const createCommentReaction = catchAsync(
  async (req: Request, res: Response) => {
    const mainData = { ...req.body, userId: req?.user?.id };
    const result = await CommentReactionService.insertIntoDB(mainData);
    sendResponse<CommentReaction>(res, {
      statusCode: 200,
      success: true,
      message: 'React submitted successfully!',
      data: result,
    });
  }
);

const getAllCommentReactions = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, commentReactionFilterableFields);
    const paginationOptions = pick(req.query, paginationFields);
    const result = await CommentReactionService.getAllFromDB(
      filters,
      paginationOptions
    );
    sendResponse<CommentReaction[]>(res, {
      statusCode: 200,
      success: true,
      message: 'React fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  }
);

const deleteCommentReaction = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await CommentReactionService.deleteFromDB(id);
    sendResponse<CommentReaction>(res, {
      statusCode: 200,
      success: true,
      message: 'React deleted successfully!',
      data: result,
    });
  }
);

export const CommentReactionController = {
  createCommentReaction,
  getAllCommentReactions,
  deleteCommentReaction,
};
