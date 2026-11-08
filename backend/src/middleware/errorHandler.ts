import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Datos inválidos',
      detalles: error.issues.map((issue) => ({
        campo: issue.path.join('.') || 'general',
        mensaje: issue.message,
      })),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(500).json({
      error: 'Error de base de datos',
      codigo: error.code,
      ...(env.NODE_ENV !== 'production' ? { detalle: error.message } : {}),
    });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'Cuerpo JSON inválido' });
    return;
  }

  console.error('[ERROR NO CONTROLADO]', error);

  res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.NODE_ENV !== 'production' && error instanceof Error
      ? { detalle: error.message }
      : {}),
  });
};
