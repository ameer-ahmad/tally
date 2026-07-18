import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export const authRouter = Router();

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: userId } });
    res.json({
      id: profile.id,
      email: profile.email,
      createdAt: profile.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
