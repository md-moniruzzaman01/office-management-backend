import { Notification, NotificationType } from '@prisma/client';
import prisma from '../shared/prisma';
import { getIO } from '../socket/mainSocket';

type NotificationInput = {
  userId: number;
  type: NotificationType;
  referenceId: number;
};

export const createNotification = async (
  data: NotificationInput
): Promise<Notification> => {
  const result = await prisma.notification.create({
    data: {
      ...data,
      isSeen: false,
    },
  });

  // ✅ Emit via namespace
  const io = getIO();

  // Emit to user room inside notification namespace
  io.of('/api/v1/socket/notification')
    .to(`user-${data.userId}`)
    .emit('notification:new', result);
  return result;
};
