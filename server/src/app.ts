import cors from 'cors';
import express from 'express';

import { apiRouter } from './routes';
import { healthRouter } from './routes/health.routes';
import { errorHandler } from './middleware/error-handler';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/v1', apiRouter);

app.use((_, res) => {
  res.status(404).json({
    message: 'Route not found.',
  });
});

app.use(errorHandler);
