import { emailConfig } from '../../../helpers/Email Service/constaints';
import prisma from '../../../shared/prisma';
import { EmailVerificationTemplate } from './Email Temp/EmailVerification';

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeVerificationCode = async (email: string, code: string) => {
  const expiresAt = new Date(Date.now() + emailConfig.verificationExpiry);

  await prisma.verificationCode.upsert({
    where: { email },
    update: { code, expiresAt },
    create: { email, code, expiresAt },
  });

  setTimeout(async () => {
    await prisma.verificationCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }, emailConfig.verificationExpiry);
};

export const verifyCode = async (
  email: string,
  code: string
): Promise<boolean> => {
  const stored = await prisma.verificationCode.findUnique({
    where: { email },
  });

  if (!stored) return false;

  if (new Date() > stored.expiresAt) {
    await prisma.verificationCode.delete({ where: { email } });
    return false;
  }

  const isValid = stored.code === code;

  if (isValid) {
    await prisma.verificationCode.delete({ where: { email } });
  }

  return isValid;
};
export const sendVerificationEmail = async (
  to: string,
  code: string
): Promise<boolean> => {
  const emailTemplate = {
    from: emailConfig.user,
    to,
    subject: 'Welcome to NEC Portal - Email Verification Required',
    html: EmailVerificationTemplate(code),
  };

  try {
    await emailConfig.smtp.sendMail(emailTemplate);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};
