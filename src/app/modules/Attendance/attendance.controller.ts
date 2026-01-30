import { Attendance, AttendanceLog } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import {
  AttendanceFilterableFields,
  attendanceFilterFieldsForDownload,
} from './attendance.constaints';
import { UserWithAttendance } from './attendance.interface';
import { AttendanceService } from './attendance.service';
import { getAttendanceDataFromMachine } from './attendance.utilities';

const createAttendanceManually = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const result = await AttendanceService.insertIntoDBManually(req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'user fetched successfully',
      data: result,
    });
  }
);
const createAttendance = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const data = await getAttendanceDataFromMachine(req);

    if (!data) {
      res.status(200).send('OK');
      return;
    }

    const result = await AttendanceService.insertIntoDB(data);

    res.status(200).send('OK');
  }
);

const getSingleAttendance = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await AttendanceService.getByIdFromDB(id);
  sendResponse<Attendance>(res, {
    statusCode: 200,
    success: true,
    message: 'Attendance fetched successfully!',
    data: result,
  });
});

const getAllAttendance = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, AttendanceFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await AttendanceService.getAllFromDB(
    filters,
    paginationOptions,
    req
  );
  sendResponse<Array<UserWithAttendance>>(res, {
    statusCode: 200,
    success: true,
    message: 'Attendance fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateAttendance = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await AttendanceService.updateOneInDB(id, updatedData);
  sendResponse<Attendance>(res, {
    statusCode: 200,
    success: true,
    message: 'Attendance updated successfully!',
    data: result,
  });
});

const deleteAttendance = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AttendanceService.deleteFromDB(id);
  sendResponse<Attendance>(res, {
    statusCode: 200,
    success: true,
    message: 'Attendance deleted successfully!',
    data: result,
  });
});

const deleteAttendanceLog = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AttendanceService.deleteAttendanceLogFromDB(id);
  sendResponse<AttendanceLog>(res, {
    statusCode: 200,
    success: true,
    message: 'Attendance deleted successfully!',
    data: result,
  });
});

const getAttendanceForDownloadFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, attendanceFilterFieldsForDownload);
    await AttendanceService.downloadAttendanceFromDB(filters, res);
  }
);

export const ServiceAttendanceController = {
  createAttendanceManually,
  createAttendance,
  getSingleAttendance,
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
  deleteAttendanceLog,
  getAttendanceForDownloadFromDB,
};
