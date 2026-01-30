import nodemailer from 'nodemailer';

export const emailConfig = {
  smtp: nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 10000, // 10 sec timeout
    greetingTimeout: 5000, // 5 sec greeting wait
    socketTimeout: 20000, // 20 sec socket timeout
  }),

  user: process.env.EMAIL,
  verificationExpiry: 120 * 60 * 1000,
};
