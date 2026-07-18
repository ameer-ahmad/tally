import type { Metric, MetricEntry } from '@prisma/client';
import { formatDateOnly } from './dates.js';

export function serializeMetric(metric: Metric) {
  return {
    id: metric.id,
    userId: metric.userId,
    name: metric.name,
    unit: metric.unit,
    createdAt: metric.createdAt.toISOString(),
  };
}

export function serializeMetricEntry(entry: MetricEntry) {
  return {
    id: entry.id,
    metricId: entry.metricId,
    date: formatDateOnly(entry.date),
    value: entry.value,
  };
}

export function averageOfValues(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return sum / values.length;
}
