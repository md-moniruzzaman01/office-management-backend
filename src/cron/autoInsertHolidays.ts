import cron from 'node-cron';
import { syncBangladeshHolidays } from '../app/modules/Holiday/holiday.utils';

// cron.schedule("0 1 1 1 *", async () => {
//   await syncBangladeshHolidays(new Date().getFullYear());
// });
cron.schedule('0 0 1 * *', async () => {
  await syncBangladeshHolidays(new Date().getFullYear());
});
