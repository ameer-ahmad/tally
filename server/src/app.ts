import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { metricsRouter } from './routes/metrics.js';
import { habitsRouter } from './routes/habits.js';

export function createApp() {
  const app = express();
  const allowedOrigins = new Set(
    [
      process.env.CLIENT_URL || 'http://localhost:5173',
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : '',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    ].filter(Boolean),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'tally-api' });
  });

  app.use('/auth', authRouter);
  app.use('/metrics', metricsRouter);
  app.use('/habits', habitsRouter);

  app.use(errorHandler);
  return app;
}
