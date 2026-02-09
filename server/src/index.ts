import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import betsRouter from './routes/bets.js';
import relayRouter from './routes/relay.js';

const app = express();

app.use(cors());
app.use(express.json());

// Connect to DB before handling requests
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes with /api prefix (local dev) and without (Vercel strips /api)
app.use('/api/bets', betsRouter);
app.use('/api/relay', relayRouter);
app.use('/bets', betsRouter);
app.use('/relay', relayRouter);

// Local dev: listen on port
if (process.env.NODE_ENV !== 'production') {
  const PORT = Number(process.env.PORT) || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
