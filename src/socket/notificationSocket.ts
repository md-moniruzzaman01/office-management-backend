// src/socket/notificationSocket.ts
import { Namespace, Socket } from 'socket.io';

export const setupNotificationSocket = (nsp: Namespace) => {
  nsp.on('connection', (socket: Socket) => {
    socket.on('join', (userId: number) => {
      socket.join(`user-${userId}`);
    });

    socket.on('disconnect', () => {});
  });
};
