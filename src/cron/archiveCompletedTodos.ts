import cron from 'node-cron';
import prisma from '../shared/prisma';

// Runs every day at 12:05 AM
cron.schedule('5 0 * * *', async () => {
  try {
    await prisma.todo.updateMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          lt: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      data: {
        status: 'ARCHIVED',
      },
    });
  } catch (error) {
    console.error('❌ Failed to archive completed todos:', error);
  }
});
