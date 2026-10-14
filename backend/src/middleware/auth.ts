import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../http.js';

export type Role = 'user' | 'admin';
export type AuthUser = { id: number; role: Role };

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthUser;
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign({ role: user.role }, config.jwtSecret, { subject: String(user.id), expiresIn: '7d' });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Token ausente');
  try {
    const p = jwt.verify(header.slice(7), config.jwtSecret) as jwt.JwtPayload;
    req.auth = { id: Number(p.sub), role: p.role };
    next();
  } catch {
    throw new HttpError(401, 'Token inválido ou expirado');
  }
}

export const requireRole = (role: Role) => (req: Request, _res: Response, next: NextFunction) => {
  if (req.auth?.role !== role) throw new HttpError(403, 'Acesso negado');
  next();
};
