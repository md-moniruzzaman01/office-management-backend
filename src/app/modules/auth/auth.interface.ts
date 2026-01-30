import { ENUM_USER_ROLE } from '../../../enum/user';

export type ILoginUser = {
  email: string;
  password: string;
};

export type ILoginUserResponse = {
  accessToken: string;
  refreshToken?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

export type IRefreshTokenResponse = {
  accessToken: string;
};

export type IVerifiedLoginUser = {
  userId: string;
  role: ENUM_USER_ROLE;
};

export type IUserFilterRequest = {
  searchTerm?: string;
};

export type IChangePassword = {
  oldPassword: string;
  newPassword: string;
};
