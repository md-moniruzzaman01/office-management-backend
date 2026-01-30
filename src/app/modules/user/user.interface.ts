import {
  ENUM_USER_EXIT_TYPE,
  ENUM_USER_GENDER,
  ENUM_USER_ROLE,
  ENUM_USER_STATUS,
} from '../../../enum/user';

export type IUserFilterRequest = {
  searchTerm?: string;
  departmentId?: string;
  branchId?: string;
  role?: ENUM_USER_ROLE;
};
export type IReviewFilterRequest = {
  searchTerm?: string;
};
export type ReviewWithReviewer = {
  message: string;
  rating: number;
  createdAt: Date;
  reviewer: {
    name: string;
    profileImage: string | null;
    department: {
      name: string;
      branch: {
        name: string;
        company: {
          name: string;
        };
      };
    } | null;
  };
};

export type CreateUserInput = {
  name: string;
  email: string;
  bloodGroup: string;
  contactNo: string;
  designation: string;
  departmentId: number;
  fingerId?: number;
  profileImage?: string;
  powerId: number[];
  password: string;
  skills?: string[];
  gender: ENUM_USER_GENDER;
  address: string;
  employeeId: string;
  joiningDate: Date;
  status?: ENUM_USER_STATUS;
  dateOfBirth?: Date;
  terminationDate?: Date;
  resignationDate?: Date;
  exitType?: ENUM_USER_EXIT_TYPE;
  exitReason?: string;
  lastWorkingDay?: Date;
  hireDate?: Date;
  verified?: boolean;
  nidNo?: string;
  nidImage?: string;
  cvImages?: string;
  role: ENUM_USER_ROLE;
  roasters: string[];
};

export interface CreateReviewInput {
  message: string;
  rating: number;
  reviewerId: number;
  revieweeId: number;
}
