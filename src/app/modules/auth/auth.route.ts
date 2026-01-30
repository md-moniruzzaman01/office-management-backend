import express from 'express';
//
import { ENUM_USER_ROLE } from '../../../enum/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = express.Router();

router
  .post(
    '/login',
    validateRequest(AuthValidation.loginZodSchema),
    AuthController.loginUser
  )
  .post('/email-verify', AuthController.verifyEmail)
  .post(
    '/resend-verification-mail',
    validateRequest(AuthValidation.resendVerificationMailSchema),
    AuthController.resendVerificationMail
  )
  .post(
    '/change-password',
    auth(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.EMPLOYEE,
      ENUM_USER_ROLE.HR,
      ENUM_USER_ROLE.MANAGER,
      ENUM_USER_ROLE.INCHARGE
    ),
    AuthController.resetPassword
  )
  .get(
    '/me',
    auth(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.EMPLOYEE,
      ENUM_USER_ROLE.HR,
      ENUM_USER_ROLE.MANAGER,
      ENUM_USER_ROLE.INCHARGE
    ),
    AuthController.me
  );

export const AuthRoutes = router;
