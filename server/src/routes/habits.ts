import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, getAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/http-error.js';
import {
  currentYearMonth,
  dateString,
  monthBounds,
  optionalYearMonthQuerySchema,
  parseDateOnly,
} from '../lib/dates.js';
import {
  computeHabitsMonthSummary,
  isHabitActiveOn,
  serializeHabit,
  serializeHabitCompletion,
  weekdayUtc,
} from '../lib/habits.js';

export const habitsRouter = Router();

habitsRouter.use(requireAuth);

const weekdaySchema = z.number().int().min(0).max(6);

const activeDaysSchema = z
  .array(weekdaySchema)
  .max(7)
  .refine((days) => new Set(days).size === days.length, {
    message: 'activeDays must not contain duplicates',
  });

const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  activeDays: activeDaysSchema,
});

const updateHabitSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    activeDays: activeDaysSchema.optional(),
  })
  .refine((body) => body.name !== undefined || body.activeDays !== undefined, {
    message: 'Provide name and/or activeDays',
  });

const upsertCompletionSchema = z.object({
  date: dateString,
  completed: z.boolean(),
});

async function getOwnedHabit(habitId: string, userId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!habit) {
    throw new HttpError(404, 'Habit not found');
  }
  return habit;
}

/** GET /habits */
habitsRouter.get('/', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ habits: habits.map(serializeHabit) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /habits/month?year=&month=
 * Must be registered before /:id routes.
 */
habitsRouter.get('/month', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const query = optionalYearMonthQuerySchema.parse(req.query);
    const defaults = currentYearMonth();
    const year = query.year ?? defaults.year;
    const month = query.month ?? defaults.month;
    const { start, end } = monthBounds(year, month);

    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const habitIds = habits.map((h) => h.id);
    const completions =
      habitIds.length === 0
        ? []
        : await prisma.habitCompletion.findMany({
            where: {
              habitId: { in: habitIds },
              date: { gte: start, lte: end },
            },
            orderBy: { date: 'asc' },
          });

    res.json({
      year,
      month,
      ...computeHabitsMonthSummary(habits, completions, year, month),
    });
  } catch (err) {
    next(err);
  }
});

habitsRouter.post('/', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const body = createHabitSchema.parse(req.body);
    const uniqueDays = [...new Set(body.activeDays)].sort((a, b) => a - b);

    const habit = await prisma.habit.create({
      data: {
        userId,
        name: body.name,
        activeDays: uniqueDays,
      },
    });
    res.status(201).json(serializeHabit(habit));
  } catch (err) {
    next(err);
  }
});

habitsRouter.patch('/:id', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    await getOwnedHabit(req.params.id, userId);
    const body = updateHabitSchema.parse(req.body);

    const habit = await prisma.habit.update({
      where: { id: req.params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.activeDays !== undefined
          ? { activeDays: [...new Set(body.activeDays)].sort((a, b) => a - b) }
          : {}),
      },
    });
    res.json(serializeHabit(habit));
  } catch (err) {
    next(err);
  }
});

habitsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    await getOwnedHabit(req.params.id, userId);
    await prisma.habit.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** PUT /habits/:id/completions — upsert completion for a date */
habitsRouter.put('/:id/completions', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const habit = await getOwnedHabit(req.params.id, userId);
    const body = upsertCompletionSchema.parse(req.body);
    const date = parseDateOnly(body.date);
    const weekday = weekdayUtc(date);

    if (!isHabitActiveOn(habit.activeDays, weekday)) {
      throw new HttpError(400, 'Habit is not scheduled for this weekday');
    }

    const completion = await prisma.habitCompletion.upsert({
      where: {
        habitId_date: {
          habitId: habit.id,
          date,
        },
      },
      create: {
        habitId: habit.id,
        date,
        completed: body.completed,
      },
      update: {
        completed: body.completed,
      },
    });

    res.json(serializeHabitCompletion(completion));
  } catch (err) {
    next(err);
  }
});
