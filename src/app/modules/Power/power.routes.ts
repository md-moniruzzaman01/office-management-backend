import { Router } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ServicePowerController } from './power.controller';
import { powerValidation } from './power.validation';

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
    ServicePowerController.getAllPowers
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
    ServicePowerController.getSinglePower
  )
  .patch(
    '/:id',
    auth(ENUM_USER_ROLE.SUPER_ADMIN),
    validateRequest(powerValidation.updatePower),
    ServicePowerController.updatePower
  )
  .post(
    '/',
    auth(ENUM_USER_ROLE.SUPER_ADMIN),
    validateRequest(powerValidation.createPower),
    ServicePowerController.createPower
  )
  .delete(
    '/:id',
    auth(ENUM_USER_ROLE.SUPER_ADMIN),
    ServicePowerController.deletePower
  );

export const powerRoutes = router;
