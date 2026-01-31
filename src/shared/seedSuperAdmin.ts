import bcrypt from 'bcrypt';
import config from '../config';
import { ENUM_USER_ROLE } from '../enum/user';
import { superAdminEmail, superAdminPass } from './config/secret';
import prisma from './prisma';

const allPowers = [
  'DASHBOARD',
  'TRANSACTION',
  'COMPANY',
  'BRANCH',
  'DEPARTMENT',
  'USERS',
  'REQUISITION',
  'ATTENDANCE',
  'LEAVE',
  'TEAM',
] as const;

export const seedSuperAdmin = async () => {
  const existing = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });
  if (existing) {
    console.log('Super admin already exists.');
    return;
  }

  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Softwara',
      padImage: '',
    },
  });

  let branch = await prisma.branch.findFirst({
    where: { name: 'Head Office' },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'HQ',
        address: 'Pallabi, mirpur -2, dhaka , bangladesh',
        contactNo: '01700000000',
        companyId: company.id,
      },
    });
  }

  // 2️⃣ Department find or create
  let department = await prisma.department.findFirst({
    where: {
      name: 'Management Team',
      branchId: branch.id,
    },
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        name: 'Management Team',
        branchId: branch.id,
        workingTimeStart: '10:00 AM',
        workingTimeEnd: '06:00 PM',
        weeklyWorkingDays: [
          'SUNDAY',
          'MONDAY',
          'SATURDAY',
          'THURSDAY',
          'TUESDAY',
          'WEDNESDAY',
        ],
        yearlyLeaveCount: 22,
      },
    });
  }

  // 3️⃣ Account create with branchId (required)
  const existingAccount = await prisma.account.findFirst({
    where: { branchId: branch.id },
  });
  if (!existingAccount) {
    await prisma.account.create({
      data: {
        balance: 0,
        branchId: branch.id,
      },
    });
  }

  // 4️⃣ Powers upsert
  const powers = await Promise.all(
    allPowers.map(async (power) =>
      prisma.power.upsert({
        where: { name: power },
        update: {},
        create: { name: power },
      })
    )
  );

  // 5️⃣ Password hash
  const hashedPassword = await bcrypt.hash(
    superAdminPass as string,
    Number(config.bycrypt_salt_rounds)
  );

  // 6️⃣ Create Super Admin user + details
  const superAdmin = await prisma.user.create({
    data: {
      email: superAdminEmail as string,
      password: hashedPassword,
      role: ENUM_USER_ROLE.SUPER_ADMIN,
      details: {
        create: {
          employeeId: 'SW-0001',
          name: 'Super Admin',
          email: superAdminEmail as string,
          gender: 'MALE',
          address: 'Head Office',
          skills: ['Management', 'Leadership'],
          designation: 'Developer',
          contactNo: '01700000000',
          profileImage: '',
          status: 'ACTIVATE',
          verified: true,
          bloodGroup: 'O+', // as string per schema
          departmentId: department.id,
          powers: {
            connect: powers.map((p) => ({ id: p.id })),
          },
        },
      },
    },
  });

  console.log('✅ Super Admin created successfully with ID:', superAdmin.id);
};
