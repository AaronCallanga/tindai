import type { Request, Response } from 'express';

import { getProfileByUserId } from '../models/profile.model';

export async function getMyProfile(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized.',
    });
  }

  const profile = await getProfileByUserId(user.id);

  return res.status(200).json({
    profile,
  });
}
