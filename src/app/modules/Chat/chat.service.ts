import { Message, Prisma } from '@prisma/client';
import ApiError from '../../../errors/ApiError';
import { createNotification } from '../../../helpers/createNotification';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import {
  messageFilterableFields,
  messageSearchableFields,
} from './chat.constaints';
import { IMessageFilterRequest } from './chat.interface';

// Insert message into DB
const insertIntoDB = async (
  data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Message> => {
  const result = await prisma.message.create({ data });

  await createNotification({
    userId: result.receiverId,
    type: 'MESSAGE',
    referenceId: result.id,
  });

  return result;
};

// Find existing chat room between two users
const findChatRoom = async (senderId: number, receiverId: number) => {
  return prisma.chatRoom.findFirst({
    where: {
      OR: [
        { user1Id: senderId, user2Id: receiverId },
        { user1Id: receiverId, user2Id: senderId },
      ],
    },
  });
};

// Create a new chat room between two users
const createChatRoom = async (senderId: number, receiverId: number) => {
  return prisma.chatRoom.create({
    data: {
      user1Id: senderId,
      user2Id: receiverId,
    },
  });
};

const getAllFromDB = async (
  filters: IMessageFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<Message[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.MessageWhereInput[] = [];

  // Adding searchTerm conditions (to search content)
  if (searchTerm) {
    andConditions.push({
      OR: messageSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  // Adding other filter conditions (senderId, receiverId, chatRoomId)
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([field, value]) => {
        if (messageFilterableFields.includes(field)) {
          return { [field]: value }; // Only allow valid filterable fields
        }
        return {};
      }),
    });
  }

  // Ensure the messages are filtered by chatRoomId
  if (filters.chatRoomId) {
    andConditions.push({ chatRoomId: filters.chatRoomId });
  }

  const whereConditions: Prisma.MessageWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.message.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
    include: {
      sender: true,
      receiver: true,
    },
  });

  const total = await prisma.message.count({ where: whereConditions });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// Get a message by its ID
const getByIdFromDB = async (id: number): Promise<Message | null> => {
  return prisma.message.findUnique({ where: { id } });
};

// Update a message in DB
const updateOneInDB = async (
  id: number,
  payload: Partial<Message>
): Promise<Message | null> => {
  try {
    return await prisma.message.update({
      where: { id },
      data: payload,
    });
  } catch (error) {
    throw new ApiError(400, 'Message not found or could not be updated');
  }
};

// Delete a message from DB
const deleteFromDB = async (id: number): Promise<Message> => {
  try {
    return await prisma.message.delete({ where: { id } });
  } catch (error) {
    throw new ApiError(400, 'Message not found or could not be deleted');
  }
};

export const MessageService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  updateOneInDB,
  findChatRoom,
  createChatRoom,
};
