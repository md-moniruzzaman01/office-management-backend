import { Router } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ServiceRequisitionController } from './requisition.controller';
import { requisitionValidation } from './requisition.validation';

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
    ServiceRequisitionController.getAllRequisition
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
    ServiceRequisitionController.getSingleRequisition
  )
  .patch(
    '/:id',

    auth(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.EMPLOYEE,
      ENUM_USER_ROLE.HR,
      ENUM_USER_ROLE.MANAGER,
      ENUM_USER_ROLE.INCHARGE
    ),
    validateRequest(requisitionValidation.updateRequisition),
    ServiceRequisitionController.updateRequisition
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
    validateRequest(requisitionValidation.createRequisition),
    ServiceRequisitionController.createRequisition
  )
  .delete(
    '/:id',
    auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
    ServiceRequisitionController.deleteRequisition
  );

export const requisitionRoutes = router;
