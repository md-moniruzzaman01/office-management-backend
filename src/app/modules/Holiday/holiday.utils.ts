import { HOLIDAY_API_KEY } from '../../../shared/config/secret';
import prisma from '../../../shared/prisma';

type RawHoliday = {
  name: string;
  date: string;
};

export const syncBangladeshHolidays = async (year: number) => {
  try {
    // 🔹 Calculate year boundaries
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    // 🔹 Check if holidays already exist for this year
    const existing = await prisma.holiday.findFirst({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    if (existing) {
      console.log(`⚠️ Holidays for ${year} already exist. Skipping sync.`);
      return;
    }

    // 🔹 Fetch new holidays if not already added
    const res = await fetch(
      `https://calendarific.com/api/v2/holidays?&api_key=${HOLIDAY_API_KEY}&country=BD&year=${year}&type=national`
    );

    const json = (await res.json()) as {
      response: {
        holidays: Array<{ name: string; date: { iso: string } }>;
      };
    };

    const holidays = json?.response?.holidays?.map((h) => ({
      name: h.name,
      date: new Date(h.date.iso),
    }));

    // 🔹 Insert all holidays
    await prisma.holiday.createMany({
      data: holidays,
      skipDuplicates: true, // ✅ avoids inserting duplicates if any
    });

    console.log(`✅ Inserted ${holidays.length} holidays for ${year}`);
  } catch (err) {
    console.error('❌ Holiday sync failed:', err);
  }
};
