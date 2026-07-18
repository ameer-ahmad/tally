/**
 * Seeds demo metrics/habits for an existing Supabase Auth user.
 *
 * 1. Sign up in the Tally app (or Supabase Auth dashboard)
 * 2. Copy the user UUID from Supabase → Authentication → Users
 * 3. Run from repo root:
 *      set SEED_USER_ID=<uuid>
 *      set SEED_EMAIL=you@example.com
 *      npm run db:seed --workspace=@tally/server
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function dateOnly(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

async function main() {
  const userId = process.env.SEED_USER_ID;
  const email = process.env.SEED_EMAIL || 'demo@tally.local';

  if (!userId) {
    throw new Error('Set SEED_USER_ID to a Supabase auth.users UUID before seeding.');
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId, email },
    update: { email },
  });

  const existingMetrics = await prisma.metric.count({ where: { userId } });
  if (existingMetrics === 0) {
    const weight = await prisma.metric.create({
      data: { userId, name: 'Weight', unit: 'lbs' },
    });
    const sleep = await prisma.metric.create({
      data: { userId, name: 'Sleep', unit: 'hrs' },
    });

    await prisma.metricEntry.createMany({
      data: [
        { metricId: weight.id, date: dateOnly(year, month, 1), value: 180 },
        { metricId: weight.id, date: dateOnly(year, month, 3), value: 179.5 },
        { metricId: weight.id, date: dateOnly(year, month, 5), value: 179 },
        { metricId: sleep.id, date: dateOnly(year, month, 1), value: 7.5 },
        { metricId: sleep.id, date: dateOnly(year, month, 2), value: 6.5 },
        { metricId: sleep.id, date: dateOnly(year, month, 4), value: 8 },
      ],
    });
  }

  const existingHabits = await prisma.habit.count({ where: { userId } });
  if (existingHabits === 0) {
    const workout = await prisma.habit.create({
      data: { userId, name: 'Worked out', activeDays: [1, 3, 5] },
    });
    const prayed = await prisma.habit.create({
      data: { userId, name: 'Prayed', activeDays: [] },
    });

    await prisma.habitCompletion.createMany({
      data: [
        { habitId: workout.id, date: dateOnly(year, month, 1), completed: true },
        { habitId: prayed.id, date: dateOnly(year, month, 1), completed: true },
        { habitId: prayed.id, date: dateOnly(year, month, 2), completed: true },
      ],
    });
  }

  console.log(`Seeded demo data for ${email} (${userId})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
