import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { normalizarCedula } from '../utils/cedula';

export interface UsuarioPublico {
  id: number;
  cedula: string;
  email: string | null;
  nombre: string;
  rol: string;
}

export interface LoginResult {
  token: string;
  usuario: UsuarioPublico;
}

function aUsuarioPublico(usuario: {
  id: number;
  cedula: string;
  email: string | null;
  nombre: string;
  rol: string;
}): UsuarioPublico {
  return {
    id: usuario.id,
    cedula: usuario.cedula,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
  };
}

/**
 * Autentica por email (si contiene '@'), cédula o nombre de usuario.
 * Devuelve un JWT firmado con vigencia configurable.
 */
export async function autenticar(identificador: string, password: string): Promise<LoginResult> {
  const esEmail = identificador.includes('@');

  const usuario = esEmail
    ? await prisma.usuario.findUnique({ where: { email: identificador.trim() } })
    : await prisma.usuario.findUnique({
        where: { cedula: normalizarCedula(identificador) },
      });

  if (!usuario || !usuario.activo) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const passwordCorrecta = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordCorrecta) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const payload = {
    sub: String(usuario.id),
    cedula: usuario.cedula,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

  return { token, usuario: aUsuarioPublico(usuario) };
}

/** Recupera el usuario autenticado a partir del id del token. */
export async function obtenerUsuarioPorId(id: number): Promise<UsuarioPublico> {
  const usuario = await prisma.usuario.findUnique({ where: { id } });

  if (!usuario || !usuario.activo) {
    throw new AppError(401, 'Usuario no encontrado o inactivo');
  }

  return aUsuarioPublico(usuario);
}
