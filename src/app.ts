/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
// import morgan from "morgan";
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import { ServiceAttendanceController } from './app/modules/Attendance/attendance.controller';
import routes from './app/routes';
import './cron/archiveCompletedTodos';
import './cron/autoInsertHolidays';
import './cron/deleteSeenNotifications';
import './cron/generateAttendanceAbsent';
import './cron/scheduleNotification';

const app: Application = express();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again later.',
});

// app.use(
//   cors({
//     origin: [
//       // "https://gilded-centaur-00d566.netlify.app",
//       "http://localhost:5173",
//     ],
//     credentials: true,
//   }),
// );
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin); // allow all
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
// app.use(morgan("dev"));

app.use('/api/v1', routes);

app.get('/', (req: Request, res: Response) => {
  res.send("softwara");
});



app.post('/iclock/cdata', ServiceAttendanceController.createAttendance);
app.get('/iclock/cdata', (req, res) => {
  const adjustedTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toUTCString();
  res.setHeader('Date', adjustedTime);
  res.status(200).send('OK');
});

app.get('/iclock/getrequest', (req, res) => {
  const adjustedTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toUTCString();
  res.setHeader('Date', adjustedTime);
  res.status(200).send('OK');
});

//global error handler
app.use(globalErrorHandler);
//handle not found
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: 'API Not Found',
      },
    ],
  });
  next();
});

export default app;
