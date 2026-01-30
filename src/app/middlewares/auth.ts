/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
import { NextFunction, Request, Response } from 'express';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import prisma from '../../shared/prisma';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload | null;
    }
  }
}

const auth =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //get authorization token
      const token = req.headers.authorization;
      if (!token) {
        throw new ApiError(401, 'You are not authorized');
      }
      // verify token
      let verifiedUser = null;

      try {
        verifiedUser = jwtHelpers.verifyToken(
          token,
          config.jwt.secret as Secret
        );
      } catch (error: any) {
        if (
          error.name === 'TokenExpiredError' ||
          error.name === 'JsonWebTokenError'
        ) {
          throw new ApiError(403, 'Forbidden');
        } else {
          throw error; // Re-throw other errors
        }
      }
      const existingUser = await prisma.userDetails.findUnique({
        where: { userId: verifiedUser?.id },
        include: { department: true },
      });

      if (!existingUser?.verified) {
        throw new ApiError(403, 'Your account is not verified');
      }
      if (existingUser?.status !== 'ACTIVATE') {
        throw new ApiError(403, 'Your account is deactivated');
      }

      req.user = verifiedUser;
      if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
        throw new ApiError(403, 'Forbidden');
      }
      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
