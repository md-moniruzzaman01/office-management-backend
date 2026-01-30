import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { dashboardFilterableFields } from './dashboard.constaints';
import { DashboardService } from './dashboard.service';

const getAllDashboardDetails = catchAsync(
  async (req: Request, res: Response) => {
    const result = await DashboardService.getAllFromDB();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Dashboard fetched successfully!',
      data: result,
    });
  }
);
const getAllDashboardDetailsForDownload = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, dashboardFilterableFields);

    await DashboardService.getAllForDownloadFromDB(filters, res);
  }
);
export const ServiceDashboardController = {
  getAllDashboardDetails,
  getAllDashboardDetailsForDownload,
};
