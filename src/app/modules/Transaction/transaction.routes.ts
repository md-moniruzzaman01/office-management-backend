import { Router } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ServiceTransactionController } from './transaction.controller';
import { transactionValidation } from './transaction.validation';

const router = Router();

router
  .get(
    '/',
    auth(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.EMPLOYEE,
      ENUM_USER_ROLE.HR,
      ENUM_USER_ROLE.MANAGER,
      ENUM_USER_ROLE.INCHARGE
    ),
    ServiceTransactionController.getAllTransactions
  )
  .get(
    '/:id',
    auth(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.EMPLOYEE,
      ENUM_USER_ROLE.HR,
      ENUM_USER_ROLE.MANAGER,
      ENUM_USER_ROLE.INCHARGE
    ),
    ServiceTransactionController.getSingleTransaction
  )
  .patch(
    '/:id',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    validateRequest(transactionValidation.updateTransaction),
    ServiceTransactionController.updateTransaction
  )
  .post(
    '/',
    auth(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.EMPLOYEE,
      ENUM_USER_ROLE.HR,
      ENUM_USER_ROLE.MANAGER,
      ENUM_USER_ROLE.INCHARGE
    ),
    validateRequest(transactionValidation.createTransaction),
    ServiceTransactionController.createTransaction
  )
  .delete(
    '/:id',
    auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
    ServiceTransactionController.deleteTransaction
  );

export const transactionRoutes = router;
