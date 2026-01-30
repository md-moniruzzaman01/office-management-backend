import { Router } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ServiceMessageController } from './chat.controller';
import { messageValidation } from './chat.validation';

const router = Router();

// Get a single message by ID
router.get(
  '/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.INCHARGE,
    ENUM_USER_ROLE.MANAGER
  ),
  ServiceMessageController.getSingleMessage
);

// Get messages for a specific chat room
router.get(
  '/room/:roomId',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.INCHARGE,
    ENUM_USER_ROLE.MANAGER
  ),
  ServiceMessageController.getChatRoomMessages
);

// Create a new message
router.post(
  '/',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.INCHARGE,
    ENUM_USER_ROLE.MANAGER
  ),
  validateRequest(messageValidation.createMessage),
  ServiceMessageController.createMessage
);

// Update a message by ID
router.patch(
  '/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.INCHARGE,
    ENUM_USER_ROLE.MANAGER
  ),
  validateRequest(messageValidation.updateMessage),
  ServiceMessageController.updateMessage
);
router.get(
  '/chatroom/:senderId/:receiverId',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.INCHARGE,
    ENUM_USER_ROLE.MANAGER
  ),
  ServiceMessageController.getChatRoomId
);

// Delete a message by ID
router.delete(
  '/:id',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.HR),
  ServiceMessageController.deleteMessage
);

export const messageRoutes = router;
