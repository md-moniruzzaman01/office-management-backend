import { Request, Response } from 'express';
import config from '../../../config';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { verifyCode } from './auth.emailverify';
import { ILoginUserResponse } from './auth.interface';
import { AuthService } from './auth.service';

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await AuthService.loginUser(loginData);
  const { refreshToken } = result;
  // set refresh token into cookie
  const cookieOptions = {
    secure: config.env === 'production',
    httpOnly: true,
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  sendResponse<ILoginUserResponse>(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully !',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account recovered!',
  });
});

export const me = async (req: Request, res: Response): Promise<void> => {
  const id = await req?.user?.id;
  const result = await AuthService.getMeFromDB(id);
  res.json(result);
};

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Email and verification code are required',
    });
  }

  const isValid = await verifyCode(email, code);

  if (!isValid) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Invalid or expired verification code',
    });
  }

  await AuthService.updateVerificationStatus(email, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Email verified successfully',
  });
});
export const resendVerificationMail = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.body;
    const parseId = parseInt(id);
    const result = await AuthService.resendVerificationMail(parseId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Resend verification mail successfully',
      data: result,
    });
  }
);

export const AuthController = {
  loginUser,
  resetPassword,
  me,
  verifyEmail,
  resendVerificationMail,
};
