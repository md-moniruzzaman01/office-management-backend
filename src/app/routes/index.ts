import express from 'express';
import { accountRoutes } from '../modules/Account/account.routes';
import { activityReactionRoutes } from '../modules/Activity Reaction/activityReaction.routes';
import { activityRoutes } from '../modules/Activity/activity.routes';
import { attendanceRoutes } from '../modules/Attendance/attendance.routes';
import { AuthRoutes } from '../modules/auth/auth.route';
import { branchRoutes } from '../modules/Branch/branch.routes';
import { messageRoutes } from '../modules/Chat/chat.routes';
import { commentReactionRoutes } from '../modules/Comment Reaction/commentReaction.routes';
import { commentRoutes } from '../modules/Comment/comment.routes';
import { companyRoutes } from '../modules/Company/company.routes';
import { dashboardRoutes } from '../modules/Dashboard/dashboard.routes';
import { departmentRoutes } from '../modules/departments/department.routes';
import { eventRoutes } from '../modules/Event/event.routes';
import { holidayRoutes } from '../modules/Holiday/holiday.routes';
import { leaveApplicationsRoutes } from '../modules/leave application/leaveApplication.routes';
import { notificationRoutes } from '../modules/Notification/notification.routes';
import { powerRoutes } from '../modules/Power/power.routes';
import { requisitionRoutes } from '../modules/Requisition/requisition.routes';
import { todoRoutes } from '../modules/Todo/todo.routes';
import { transactionRoutes } from '../modules/Transaction/transaction.routes';
import { usersRoutes } from '../modules/user/user.routes';
const router = express.Router();

const moduleRoutes = [
  // ... routes
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/dashboard',
    route: dashboardRoutes,
  },
  {
    path: '/users',
    route: usersRoutes,
  },
  {
    path: '/departments',
    route: departmentRoutes,
  },
  {
    path: '/leave-applications',
    route: leaveApplicationsRoutes,
  },
  {
    path: '/holidays',
    route: holidayRoutes,
  },
  {
    path: '/events',
    route: eventRoutes,
  },
  {
    path: '/activities',
    route: activityRoutes,
  },
  {
    path: '/attendances',
    route: attendanceRoutes,
  },
  {
    path: '/branches',
    route: branchRoutes,
  },
  {
    path: '/powers',
    route: powerRoutes,
  },
  {
    path: '/comments',
    route: commentRoutes,
  },
  {
    path: '/activity-reactions',
    route: activityReactionRoutes,
  },
  {
    path: '/comment-reactions',
    route: commentReactionRoutes,
  },
  {
    path: '/chats',
    route: messageRoutes,
  },
  {
    path: '/company',
    route: companyRoutes,
  },
  {
    path: '/requisition',
    route: requisitionRoutes,
  },
  {
    path: '/transaction',
    route: transactionRoutes,
  },
  {
    path: '/account',
    route: accountRoutes,
  },
  {
    path: '/todo',
    route: todoRoutes,
  },
  {
    path: '/dashboard',
    route: dashboardRoutes,
  },
  {
    path: '/notification',
    route: notificationRoutes,
  },
  {
    path: '/attendance',
    route: attendanceRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
