import { Notification } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { notificationFilterableFields } from './notification.constaints';
import { NotificationService } from './notification.service';

const createNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.insertIntoDB(req.body);

  sendResponse<Notification>(res, {
    statusCode: 200,
    success: true,
    message: 'Notification added successfully!',
    data: result,
  });
});

const getSingleNotification = catchAsync(
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await NotificationService.getByIdFromDB(id);
    sendResponse<Notification>(res, {
      statusCode: 200,
      success: true,
      message: 'Notification fetched successfully!',
      data: result,
    });
  }
);

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, notificationFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await NotificationService.getAllFromDB(
    filters,
    paginationOptions,
    req
  );
  sendResponse<Notification[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Notification fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateNotification = catchAsync(async (req: Request, res: Response) => {
  const ids = req.body.ids;
  const result = await NotificationService.updateManyInDB(ids);
  sendResponse<{ count: number }>(res, {
    statusCode: 200,
    success: true,
    message: 'Notification updated successfully!',
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await NotificationService.deleteFromDB(id);
  sendResponse<Notification>(res, {
    statusCode: 200,
    success: true,
    message: 'Notification deleted successfully!',
    data: result,
  });
});

export const ServiceNotificationController = {
  createNotification,
  getSingleNotification,
  getAllNotifications,
  updateNotification,
  deleteNotification,
};
