import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from '../lib/http-error.js';
import { prisma } from '../lib/prisma.js';

export type AuthedRequest = Request & {
  userId: string;
  userEmail: string;
};

export function getAuth(req: Request): AuthedRequest {
  return req as unknown as AuthedRequest;
}

const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required');
}

const JWKS = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
const issuer = `${supabaseUrl}/auth/v1`;

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing or invalid Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new HttpError(401, 'Missing access token');
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: 'authenticated',
    });

    const userId = payload.sub;
    if (!userId) {
      throw new HttpError(401, 'Token missing subject');
    }

    const email =
      typeof payload.email === 'string'
        ? payload.email
        : typeof payload.user_metadata === 'object' &&
            payload.user_metadata &&
            typeof (payload.user_metadata as { email?: unknown }).email === 'string'
          ? (payload.user_metadata as { email: string }).email
          : '';

    await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId, email: email || `${userId}@unknown.local` },
      update: email ? { email } : {},
    });

    (req as AuthedRequest).userId = userId;
    (req as AuthedRequest).userEmail = email;
    next();
  } catch (err) {
    if (err instanceof HttpError) {
      next(err);
      return;
    }
    next(new HttpError(401, 'Invalid or expired token'));
  }
}
