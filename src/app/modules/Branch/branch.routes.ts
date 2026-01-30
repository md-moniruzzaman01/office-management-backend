import { Router } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ServiceBranchController } from './branch.controller';
import { branchValidation } from './branch.validation';

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
    ServiceBranchController.getAllBranches
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
    ServiceBranchController.getSingleBranch
  )
  .patch(
    '/:id',
    auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
    validateRequest(branchValidation.updateBranch),
    ServiceBranchController.updateBranch
  )
  .post(
    '/',
    auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
    validateRequest(branchValidation.createBranch),
    ServiceBranchController.createBranch
  )
  .delete(
    '/:id',
    auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
    ServiceBranchController.deleteBranch
  );

export const branchRoutes = router;
