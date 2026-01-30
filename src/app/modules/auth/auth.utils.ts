import bcrypt from 'bcrypt';
import prisma from '../../../shared/prisma';

interface UserWithPowers {
  id: number;
  email: string;
  password: string;
  role: string;
  powers: number[];
  verified: boolean;
  status: 'ACTIVATE' | 'DEACTIVATE';
}
export async function isUserExist(
  email: string
): Promise<UserWithPowers | null> {
  const result = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      password: true,
      details: {
        select: {
          verified: true,
          status: true,
          powers: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!result) return null;

  const { details, ...userData } = result;
  const powers = details?.powers.map((power) => power.id) || [];
  const verified = details?.verified ?? false;
  const status = details?.status ?? 'DEACTIVATE';
  return { ...userData, status, powers, verified };
}

export async function isPasswordMatched(
  givenPassword: string,
  savedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, savedPassword);
}
