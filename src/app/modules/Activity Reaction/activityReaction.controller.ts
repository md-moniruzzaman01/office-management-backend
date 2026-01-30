import { ActivityReaction } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { activityReactionFilterableFields } from './activityReaction.constaints';
import { ActivityReactionService } from './activityReaction.service';

const createActivityReaction = catchAsync(
  async (req: Request, res: Response) => {
    const mainData = { ...req.body, userId: req?.user?.id };
    const result = await ActivityReactionService.insertIntoDB(mainData);
    sendResponse<ActivityReaction>(res, {
      statusCode: 200,
      success: true,
      message: 'React submitted successfully!',
      data: result,
    });
  }
);

const getAllActivityReactions = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, activityReactionFilterableFields);
    const paginationOptions = pick(req.query, paginationFields);
    const result = await ActivityReactionService.getAllFromDB(
      filters,
      paginationOptions
    );
    sendResponse<ActivityReaction[]>(res, {
      statusCode: 200,
      success: true,
      message: 'React fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  }
);

const deleteActivityReaction = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await ActivityReactionService.deleteFromDB(id);
    sendResponse<ActivityReaction>(res, {
      statusCode: 200,
      success: true,
      message: 'React deleted successfully!',
      data: result,
    });
  }
);

export const ActivityReactionController = {
  createActivityReaction,
  getAllActivityReactions,
  deleteActivityReaction,
};
