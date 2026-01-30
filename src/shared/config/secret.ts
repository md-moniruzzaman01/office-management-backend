import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export const CLIENT_URL = process.env.CLIENT_SITE_URL;
export const HOLIDAY_API_KEY = process.env.HOLIDAYS_API_KEY;
export const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
export const superAdminPass = process.env.SUPER_ADMIN_PASS;
