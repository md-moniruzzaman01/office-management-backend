import { Message } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { getIO } from '../../../socket/mainSocket';
import { MessageService } from './chat.service';

const createMessage = catchAsync(async (req: Request, res: Response) => {
  const { senderId, receiverId, content } = req.body;

  let chatRoom = await MessageService.findChatRoom(senderId, receiverId);

  if (!chatRoom) {
    chatRoom = await MessageService.createChatRoom(senderId, receiverId);
  }

  const message = await MessageService.insertIntoDB({
    senderId,
    receiverId,
    chatRoomId: chatRoom.id,
    content,
  });

  getIO().to(`room-${chatRoom.id}`).emit('newMessage', message);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Message sent successfully!',
    data: message,
  });
});

const getSingleMessage = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await MessageService.getByIdFromDB(id);

  sendResponse<Message>(res, {
    statusCode: 200,
    success: true,
    message: 'Message fetched successfully!',
    data: result,
  });
});

const getChatRoomMessages = catchAsync(async (req: Request, res: Response) => {
  const chatRoomId = parseInt(req.params.roomId);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await MessageService.getAllFromDB(
    { chatRoomId },
    paginationOptions
  );

  sendResponse<Message[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Chat room messages fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});
const getChatRoomId = catchAsync(async (req: Request, res: Response) => {
  const { senderId, receiverId } = req.params; // Assuming senderId and receiverId are part of the URL params

  let chatRoom = await MessageService.findChatRoom(
    Number(senderId),
    Number(receiverId)
  );

  if (!chatRoom) {
    chatRoom = await MessageService.createChatRoom(
      Number(senderId),
      Number(receiverId)
    );
  }

  // Ensure senderId and receiverId are valid numbers
  if (isNaN(Number(senderId)) || isNaN(Number(receiverId))) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Invalid sender or receiver ID.',
    });
  }

  // Find the chat room between the two users
  const result = await MessageService.findChatRoom(
    Number(senderId),
    Number(receiverId)
  );

  // Handle the case when no chat room is found
  if (!result) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: 'Chat room not found.',
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Chat room fetched successfully!',
    data: result,
  });
});

const updateMessage = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updatedData = req.body;

  const result = await MessageService.updateOneInDB(id, updatedData);

  if (result) {
    getIO().to(`room-${result.chatRoomId}`).emit('messageUpdated', result);
  }

  sendResponse<Message>(res, {
    statusCode: 200,
    success: true,
    message: 'Message updated successfully!',
    data: result,
  });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const message = await MessageService.getByIdFromDB(id);
  const result = await MessageService.deleteFromDB(id);

  if (message) {
    getIO().to(`room-${message.chatRoomId}`).emit('messageDeleted', { id });
  }

  sendResponse<Message>(res, {
    statusCode: 200,
    success: true,
    message: 'Message deleted successfully!',
    data: result,
  });
});

export const ServiceMessageController = {
  createMessage,
  getSingleMessage,
  getChatRoomMessages,
  updateMessage,
  deleteMessage,
  getChatRoomId,
};
