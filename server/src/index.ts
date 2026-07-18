import 'dotenv/config';
import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 3001;
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

app.listen(port, () => {
  console.log(`Tally API listening on http://localhost:${port}`);
});
