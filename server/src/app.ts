import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { metricsRouter } from './routes/metrics.js';

export function createApp() {
  const app = express();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  app.use(
    cors({
      origin: clientUrl,
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'tally-api' });
  });

  app.use('/auth', authRouter);
  app.use('/metrics', metricsRouter);

  app.use(errorHandler);
  return app;
}
