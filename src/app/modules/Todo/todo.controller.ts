import { Todo } from '@prisma/client';
import { Request, Response } from 'express';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { todoFilterableFields } from './todo.constaints';
import { TodoService } from './todo.service';

const createTodo = catchAsync(async (req: Request, res: Response) => {
  const result = await TodoService.insertIntoDB(req.body, req);
  sendResponse<Todo>(res, {
    statusCode: 200,
    success: true,
    message: 'Todo added successfully!',
    data: result,
  });
});

const getSingleTodo = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await TodoService.getByIdFromDB(id);
  sendResponse<Todo>(res, {
    statusCode: 200,
    success: true,
    message: 'Todo fetched successfully!',
    data: result,
  });
});

const getAllTodos = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, todoFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await TodoService.getAllFromDB(filters, paginationOptions);
  sendResponse<Todo[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Todo fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});
const getTodoOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await TodoService.getOverviewFromDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Todo overview fetched successfully!',
    data: result,
  });
});

const updateTodo = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await TodoService.updateOneInDB(id, updatedData);
  sendResponse<Todo>(res, {
    statusCode: 200,
    success: true,
    message: 'Todo updated successfully!',
    data: result,
  });
});

const deleteTodo = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await TodoService.deleteFromDB(id);
  sendResponse<Todo>(res, {
    statusCode: 200,
    success: true,
    message: 'Todo deleted successfully!',
    data: result,
  });
});

export const ServiceTodoController = {
  createTodo,
  getSingleTodo,
  getAllTodos,
  updateTodo,
  deleteTodo,
  getTodoOverview,
};
