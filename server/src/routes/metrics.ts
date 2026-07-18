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
  yearMonthQuerySchema,
} from '../lib/dates.js';
import { averageOfValues, serializeMetric, serializeMetricEntry } from '../lib/metrics.js';

export const metricsRouter = Router();

metricsRouter.use(requireAuth);

const createMetricSchema = z.object({
  name: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(40).nullable().optional(),
});

const updateMetricSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    unit: z.string().trim().min(1).max(40).nullable().optional(),
  })
  .refine((body) => body.name !== undefined || body.unit !== undefined, {
    message: 'Provide name and/or unit',
  });

const upsertEntrySchema = z.object({
  date: dateString,
  value: z.number().finite(),
});

async function getOwnedMetric(metricId: string, userId: string) {
  const metric = await prisma.metric.findFirst({
    where: { id: metricId, userId },
  });
  if (!metric) {
    throw new HttpError(404, 'Metric not found');
  }
  return metric;
}

/** GET /metrics?year=&month= — list metrics with monthAverage for the given (or current) month */
metricsRouter.get('/', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const query = optionalYearMonthQuerySchema.parse(req.query);
    const defaults = currentYearMonth();
    const year = query.year ?? defaults.year;
    const month = query.month ?? defaults.month;

    const { start, end } = monthBounds(year, month);
    const metrics = await prisma.metric.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        entries: {
          where: { date: { gte: start, lte: end } },
          select: { value: true },
        },
      },
    });

    res.json({
      year,
      month,
      metrics: metrics.map(({ entries, ...metric }) => ({
        ...serializeMetric(metric),
        monthAverage: averageOfValues(entries.map((e) => e.value)),
      })),
    });
  } catch (err) {
    next(err);
  }
});

metricsRouter.post('/', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const body = createMetricSchema.parse(req.body);
    const metric = await prisma.metric.create({
      data: {
        userId,
        name: body.name,
        unit: body.unit ?? null,
      },
    });
    res.status(201).json(serializeMetric(metric));
  } catch (err) {
    next(err);
  }
});

metricsRouter.patch('/:id', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    await getOwnedMetric(req.params.id, userId);
    const body = updateMetricSchema.parse(req.body);
    const metric = await prisma.metric.update({
      where: { id: req.params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.unit !== undefined ? { unit: body.unit } : {}),
      },
    });
    res.json(serializeMetric(metric));
  } catch (err) {
    next(err);
  }
});

metricsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    await getOwnedMetric(req.params.id, userId);
    await prisma.metric.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** GET /metrics/:id/entries?year=&month= */
metricsRouter.get('/:id/entries', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const metric = await getOwnedMetric(req.params.id, userId);
    const defaults = currentYearMonth();
    const { year, month } = yearMonthQuerySchema.parse({
      year: req.query.year ?? defaults.year,
      month: req.query.month ?? defaults.month,
    });
    const { start, end } = monthBounds(year, month);

    const entries = await prisma.metricEntry.findMany({
      where: {
        metricId: metric.id,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    res.json({
      year,
      month,
      metric: serializeMetric(metric),
      monthAverage: averageOfValues(entries.map((e) => e.value)),
      entries: entries.map(serializeMetricEntry),
    });
  } catch (err) {
    next(err);
  }
});

/** PUT /metrics/:id/entries — upsert one day */
metricsRouter.put('/:id/entries', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const metric = await getOwnedMetric(req.params.id, userId);
    const body = upsertEntrySchema.parse(req.body);
    const date = parseDateOnly(body.date);

    const entry = await prisma.metricEntry.upsert({
      where: {
        metricId_date: {
          metricId: metric.id,
          date,
        },
      },
      create: {
        metricId: metric.id,
        date,
        value: body.value,
      },
      update: {
        value: body.value,
      },
    });

    res.json(serializeMetricEntry(entry));
  } catch (err) {
    next(err);
  }
});

/** DELETE /metrics/:id/entries/:date */
metricsRouter.delete('/:id/entries/:date', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const metric = await getOwnedMetric(req.params.id, userId);
    const dateStr = dateString.parse(req.params.date);
    const date = parseDateOnly(dateStr);

    const existing = await prisma.metricEntry.findUnique({
      where: {
        metricId_date: {
          metricId: metric.id,
          date,
        },
      },
    });

    if (!existing) {
      throw new HttpError(404, 'Entry not found');
    }

    await prisma.metricEntry.delete({
      where: { id: existing.id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
