import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'tindai-server',
    timestamp: new Date().toISOString(),
  });
});
