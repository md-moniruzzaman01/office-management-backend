import { subDays } from 'date-fns'; // if using date-fns
import cron from 'node-cron';
import prisma from '../shared/prisma';

cron.schedule('0 2 * * *', async () => {
  const thresholdDate = subDays(new Date(), 30); // 30 days ago

  const result = await prisma.notification.deleteMany({
    where: {
      isSeen: true,
      createdAt: {
        lt: thresholdDate,
      },
    },
  });
});
