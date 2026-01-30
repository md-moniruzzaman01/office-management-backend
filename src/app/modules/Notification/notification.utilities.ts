import { Notification } from '@prisma/client';
import prisma from '../../../shared/prisma';

export async function enrichNotification(notification: Notification) {
  let data = null;

  switch (notification.type) {
    case 'TODO':
      data = await prisma.todo.findUnique({
        where: { id: notification.referenceId },
      });
      break;

    case 'LEAVE':
      data = await prisma.leave.findUnique({
        where: { id: notification.referenceId },
      });
      break;

    case 'REQUISITION':
      data = await prisma.requisition.findUnique({
        where: { id: notification.referenceId },
      });
      break;

    case 'HOLIDAY':
      data = await prisma.holiday.findUnique({
        where: { id: notification.referenceId },
      });
      break;

    case 'EVENT':
      data = await prisma.departmentEvent.findUnique({
        where: { id: notification.referenceId },
      });
      break;

    case 'ACTIVITY':
      data = await prisma.activity.findUnique({
        where: { id: notification.referenceId },
      });
      break;
    case 'MESSAGE':
      data = await prisma.message.findUnique({
        where: { id: notification.referenceId },
      });
      break;

    default:
      data = null;
      break;
  }

  return {
    ...notification,
    data,
  };
}
