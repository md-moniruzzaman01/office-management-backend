// src/socket/mainSocket.ts

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { MessageService } from '../app/modules/Chat/chat.service';
import { CLIENT_URL } from '../shared/config/secret';
import { setupChatSocket } from './chatSocket';
import { setupNotificationSocket } from './notificationSocket';

let io: SocketIOServer;

export const initializeSocketServer = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  setupNotificationSocket(io.of('/api/v1/socket/notification'));
  setupChatSocket(io.of('/api/v1/socket/chat'), MessageService);
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
