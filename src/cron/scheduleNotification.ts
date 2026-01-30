import cron from 'node-cron';
import prisma from '../shared/prisma';

cron.schedule('0 6 * * *', async () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const startOfTomorrow = new Date(
    tomorrow.getFullYear(),
    tomorrow.getMonth(),
    tomorrow.getDate(),
    0,
    0,
    0
  );

  const endOfTomorrow = new Date(
    tomorrow.getFullYear(),
    tomorrow.getMonth(),
    tomorrow.getDate(),
    23,
    59,
    59
  );

  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: startOfTomorrow,
        lte: endOfTomorrow,
      },
    },
  });

  const events = await prisma.departmentEvent.findMany({
    where: {
      startDate: { lte: endOfTomorrow },
      endDate: { gte: startOfTomorrow },
    },
  });

  const allUsers = await prisma.userDetails.findMany({
    select: { id: true },
  });

  for (const user of allUsers) {
    for (const holiday of holidays) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'HOLIDAY',
          referenceId: holiday.id,
        },
      });
    }
  }

  for (const event of events) {
    if (!event.departmentId) continue;

    const deptUsers = await prisma.userDetails.findMany({
      where: {
        departmentId: event.departmentId,
      },
      select: { id: true },
    });

    for (const user of deptUsers) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'EVENT',
          referenceId: event.id,
        },
      });
    }
  }
});
