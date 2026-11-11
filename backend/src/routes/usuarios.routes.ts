import { Router } from 'express';
import { z } from 'zod';
import { Rol } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import {
  actualizarUsuario,
  crearUsuario,
  listarUsuarios,
} from '../services/usuario.service';

const router = Router();

router.use(requireAuth, requireRole(Rol.ROOT));

const crearSchema = z.object({
  cedula: z.string()
    .trim()
    .regex(/^\d{5,9}$/, 'La cédula debe contener entre 5 y 9 dígitos numéricos'),
  nombre: z.string()
    .trim()
    .min(3, 'El nombre es obligatorio')
    .max(255)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\.']+$/, 'El nombre solo puede contener letras, espacios, puntos y apóstrofos'),
  email: z.string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .max(255)
    .email('El correo electrónico debe tener un formato válido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100),
  rol: z.nativeEnum(Rol).default(Rol.ADMIN),
});

const actualizarSchema = z
  .object({
    nombre: z.string()
      .trim()
      .min(3, 'El nombre es obligatorio')
      .max(255)
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\.']+$/, 'El nombre solo puede contener letras, espacios, puntos y apóstrofos')
      .optional(),
    password: z.string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .max(100)
      .optional(),
    rol: z.nativeEnum(Rol).optional(),
    activo: z.boolean().optional(),
    email: z.string()
      .trim()
      .min(1, 'El correo electrónico es obligatorio')
      .max(255)
      .email('El correo electrónico debe tener un formato válido')
      .optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debe indicar al menos un cambio',
  });

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const usuarios = await listarUsuarios();
    res.json({ usuarios });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const datos = crearSchema.parse(req.body);
    const usuario = await crearUsuario({
      cedula: datos.cedula,
      nombre: datos.nombre,
      email: datos.email,
      password: datos.password,
      rol: datos.rol,
    });
    res.status(201).json({ usuario });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Identificador de usuario inválido' });
      return;
    }

    const datos = actualizarSchema.parse(req.body);
    const usuario = await actualizarUsuario(id, {
      nombre: datos.nombre,
      email: datos.email,
      password: datos.password,
      rol: datos.rol,
      activo: datos.activo,
    });
    res.json({ usuario });
  }),
);

export default router;
