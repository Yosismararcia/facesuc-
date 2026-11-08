import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { AuthRequest, TokenPayload } from '../types/auth';

/**
 * Valida el token JWT enviado en: Authorization: Bearer <token>.
 * Adjunta el payload al request como req.user.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'No autorizado: token no proporcionado'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    (req as AuthRequest).user = payload;
    next();
  } catch {
    next(new AppError(401, 'No autorizado: token inválido o expirado'));
  }
}

/**
 * Restringe una ruta a uno o varios roles. Debe usarse después de requireAuth.
 */
export function requireRole(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { user } = req as AuthRequest;
    const rol = user?.rol as Rol | undefined;

    if (!rol || !roles.includes(rol)) {
      next(new AppError(403, 'No tiene permisos para realizar esta acción'));
      return;
    }

    next();
  };
}
