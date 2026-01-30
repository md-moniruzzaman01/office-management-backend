import z from 'zod';
import {
  ENUM_USER_EXIT_TYPE,
  ENUM_USER_GENDER,
  ENUM_USER_ROLE,
  ENUM_USER_STATUS,
} from '../../../enum/user';

const create = z.object({
  body: z.object({
    name: z.string({
      required_error: 'name is required',
    }),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format'),
    role: z.enum(Object.values(ENUM_USER_ROLE) as [string, ...string[]]),

    contactNo: z
      .string({ required_error: 'Contact no. is required' })
      .regex(/^(\+8801|8801|01)[0-9]{9}$/, {
        message: 'Invalid Bangladeshi contact number',
      }),
    bloodGroup: z.string({
      required_error: 'blood group is required',
    }),
    designation: z.string({
      required_error: 'designation is required',
    }),
    profileImage: z.string().optional(),

    departmentId: z.number({
      required_error: 'department is required',
    }),
    powerId: z.array(z.number()),
    password: z.string({
      required_error: 'password is required',
    }),
    gender: z.enum(Object.values(ENUM_USER_GENDER) as [string, ...string[]]),
    address: z.string({
      required_error: 'address is required',
    }),
    employeeId: z.string({
      required_error: 'employeeId is required',
    }),
    fingerId: z.union([z.number(), z.null()]),
    joiningDate: z.string().optional(),
    status: z
      .enum(Object.values(ENUM_USER_STATUS) as [string, ...string[]])
      .default('DEACTIVATE'),
    // dateOfBirth: z.union([z.string(), z.null()]),
    terminationDate: z.string().optional(),
    resignationDate: z.string().optional(),
    exitType: z
      .enum(Object.values(ENUM_USER_EXIT_TYPE) as [string, ...string[]])
      .optional(),
    exitReason: z.string().optional(),
    lastWorkingDay: z.string().optional(),
    skills: z.array(z.string()).optional(),
    hireDate: z.string().optional(),
    nidNo: z.string().optional(),
    nidImage: z.string().optional(),
    cvImages: z.array(z.string()).optional(),
    roasters: z.array(z.string()),
  }),
});

const createPower = z.object({
  body: z.object({
    name: z.string({
      required_error: 'name is required',
    }),
  }),
});
const createReview = z.object({
  body: z.object({
    message: z
      .string({
        required_error: 'Message is required',
      })
      .min(1, 'Message cannot be empty'),

    rating: z
      .number({
        required_error: 'Rating is required',
        invalid_type_error: 'Rating must be a number',
      })
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot be more than 5'),

    revieweeId: z.number({
      required_error: 'Reviewee ID is required',
    }),
  }),
});

const update = z.object({
  body: z
    .object({
      name: z.string().optional(),
      email: z.string().email('Invalid email format').optional(),

      contactNo: z
        .string()
        .regex(/^(\+8801|8801|01)[0-9]{9}$/, {
          message: 'Invalid Bangladeshi contact number',
        })
        .optional(),
      designation: z.string().optional(),
      bloodGroup: z.string().optional(),
      profileImage: z.string().optional(),
      departmentId: z.number().optional(),
      verified: z.boolean().optional(),
      powerId: z.array(z.number()).optional(),
      gender: z
        .enum(Object.values(ENUM_USER_GENDER) as [string, ...string[]])
        .optional(),
      address: z.string().optional(),
      employeeId: z.string().optional(),
      joiningDate: z.string().optional(),
      status: z
        .enum(Object.values(ENUM_USER_STATUS) as [string, ...string[]])
        .optional(),
      // dateOfBirth: z.union([z.string(), z.null()]).optional(),
      terminationDate: z.string().optional(),
      resignationDate: z.string().optional(),
      exitType: z
        .enum(Object.values(ENUM_USER_EXIT_TYPE) as [string, ...string[]])
        .optional(),
      exitReason: z.string().optional(),
      lastWorkingDay: z.string().optional(),
      role: z
        .enum(Object.values(ENUM_USER_ROLE) as [string, ...string[]])
        .optional(),
      fingerId: z.union([z.number(), z.null()]).optional(),
      skills: z.array(z.string()).optional(),
      nidNo: z.string().optional(),
      nidImage: z.string().optional(),
      cvImages: z.array(z.string()).optional(),
      roasters: z.array(z.string()).optional(),
    })
    .transform((data) => {
      if (data.status === 'ACTIVATE') {
        delete data.terminationDate;
        delete data.resignationDate;
        delete data.exitType;
        delete data.exitReason;
        delete data.lastWorkingDay;
      }
      return data;
    }),
});

export const userValidation = {
  create,
  createPower,
  createReview,
  update,
};
