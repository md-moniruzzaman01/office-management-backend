import express from 'express';
import { ENUM_USER_ROLE } from '../../../enum/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { userController } from './user.controller';
import { userValidation } from './user.validation';

const router = express.Router();

router.post(
  '/create-user',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.HR),
  validateRequest(userValidation.create),
  userController.insertIntoDB
);
router.post(
  '/create-admin',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(userValidation.create),
  userController.AdminInsertIntoDB
);
router.post(
  '/create-super_admin',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(userValidation.create),
  userController.SuperAdminInsertIntoDB
);
router.post(
  '/review',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.MANAGER,
    ENUM_USER_ROLE.INCHARGE
  ),
  validateRequest(userValidation.createReview),
  userController.insertReviewIntoDB
);

router.get(
  '/review/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.MANAGER,
    ENUM_USER_ROLE.INCHARGE
  ),
  userController.getMyReceivedReviewTeamFromDB
);
router.get(
  '/',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.MANAGER,
    ENUM_USER_ROLE.INCHARGE
  ),
  userController.getAllFromDB
);
router.get(
  '/my-team',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.MANAGER,
    ENUM_USER_ROLE.INCHARGE
  ),
  userController.getMyTeamFromDB
);

router.patch(
  '/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.MANAGER,
    ENUM_USER_ROLE.INCHARGE
  ),
  validateRequest(userValidation.update),
  userController.updateOneInDB
);
router.get(
  '/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.MANAGER,
    ENUM_USER_ROLE.INCHARGE
  ),
  userController.getByIdFromDB
);
router.get(
  '/download/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.EMPLOYEE,
    ENUM_USER_ROLE.HR,
    ENUM_USER_ROLE.MANAGER,
    ENUM_USER_ROLE.INCHARGE
  ),
  userController.getByIdForDownloadFromDB
);
router.delete(
  '/:id',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  userController.deleteFromDB
);
router.delete(
  '/review/:id',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  userController.deleteReviewFromDB
);

export const usersRoutes = router;
