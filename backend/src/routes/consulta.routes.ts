import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { registrarConsulta } from '../services/consulta.service';
import { AuthRequest } from '../types/auth';

const router = Router();

router.use(requireAuth);

const registrarSchema = z.object({
  cedula: z.string().trim().regex(/^\d{5,9}$/, 'Cédula inválida'),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const datos = registrarSchema.parse(req.body);
    const { user } = req as AuthRequest;
    const usuarioId = Number(user?.sub);

    const consulta = await registrarConsulta(
      datos.cedula,
      usuarioId,
      req.ip ?? undefined,
      req.get('User-Agent') ?? undefined,
    );

    res.status(201).json({ consulta });
  }),
);

export default router;