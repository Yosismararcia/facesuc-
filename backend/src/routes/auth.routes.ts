import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { autenticar, obtenerUsuarioPorId } from '../services/auth.service';
import { AuthRequest } from '../types/auth';

const router = Router();

const loginSchema = z
  .object({
    cedula: z.string().trim().min(1).optional(),
    usuario: z.string().trim().min(1).optional(),
    password: z.string().min(1, 'La contraseña es obligatoria'),
  })
  .refine((data) => Boolean(data.cedula || data.usuario), {
    message: 'Debe indicar la cédula o el usuario',
    path: ['cedula'],
  });

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { cedula, usuario, password } = loginSchema.parse(req.body);
    const resultado = await autenticar(cedula ?? usuario ?? '', password);
    res.json(resultado);
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { user } = req as AuthRequest;
    const usuario = await obtenerUsuarioPorId(Number(user?.sub));
    res.json({ usuario });
  }),
);

export default router;
