import { Router } from 'express';

import { authRouter } from './auth.routes';
import { profileRouter } from './profile.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
