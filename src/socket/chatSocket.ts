/* eslint-disable @typescript-eslint/no-explicit-any */
import { Namespace, Socket } from 'socket.io';

export const setupChatSocket = (nsp: Namespace, MessageService: any) => {
  nsp.on('connection', (socket: Socket) => {
    socket.on('joinRoom', async (roomId: number) => {
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }
      socket.join(`room-${roomId}`);

      try {
        const messages = await MessageService.getAllFromDB(
          { chatRoomId: roomId },
          { limit: 20, page: 1 }
        );
        socket.emit('roomMessages', messages.data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to fetch messages' });
      }
    });

    socket.on('sendMessage', async (messageData) => {
      try {
        const { senderId, receiverId, content } = messageData;

        if (!senderId || !receiverId || !content) {
          return socket.emit('messageError', { error: 'Invalid message data' });
        }

        const [user1Id, user2Id] =
          senderId < receiverId
            ? [senderId, receiverId]
            : [receiverId, senderId];

        let chatRoom = await MessageService.findChatRoom(user1Id, user2Id);

        if (!chatRoom) {
          chatRoom = await MessageService.createChatRoom(user1Id, user2Id);
        }

        const message = await MessageService.insertIntoDB({
          senderId,
          receiverId,
          chatRoomId: chatRoom.id,
          content,
        });

        nsp.to(`room-${chatRoom.id}`).emit('newMessage', message, () => {});
      } catch (error) {
        socket.emit('messageError', { error: 'Failed to process message' });
      }
    });

    socket.on('typing', ({ roomId, user }) => {
      if (roomId && user) {
        socket.to(`room-${roomId}`).emit('userTyping', user);
      }
    });

    socket.on('stopTyping', ({ roomId, user }) => {
      if (roomId && user) {
        socket.to(`room-${roomId}`).emit('userStoppedTyping', user);
      }
    });

    socket.on('disconnect', () => {});
  });
};
