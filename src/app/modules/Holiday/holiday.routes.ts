import { Router } from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ServiceHolidayController } from './holiday.controller';
import { holidayValidation } from './holiday.validation';

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
    ServiceHolidayController.getAllHolidays
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
    ServiceHolidayController.getSingleHoliday
  )
  .patch(
    '/:id',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.HR),
    validateRequest(holidayValidation.updateHoliday),
    ServiceHolidayController.updateHoliday
  )
  .post(
    '/',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.HR),
    validateRequest(holidayValidation.createHoliday),
    ServiceHolidayController.createHoliday
  )
  .delete(
    '/:id',
    auth(ENUM_USER_ROLE.SUPER_ADMIN),
    ServiceHolidayController.deleteHoliday
  );

export const holidayRoutes = router;
