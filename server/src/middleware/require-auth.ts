import type { NextFunction, Request, Response } from 'express';

import { getSupabaseAdminClient } from '../config/supabase';

function getBearerToken(request: Request) {
  const authorization = request.header('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      message: 'Missing bearer token.',
    });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }

  req.user = {
    id: data.user.id,
    email: data.user.email ?? null,
    appMetadata: data.user.app_metadata ?? {},
    userMetadata: data.user.user_metadata ?? {},
  };

  return next();
}
