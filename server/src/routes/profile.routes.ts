import { Router } from 'express';

import { getMyProfile } from '../controllers/profile.controller';
import { requireAuth } from '../middleware/require-auth';

export const profileRouter = Router();

profileRouter.get('/me', requireAuth, getMyProfile);
