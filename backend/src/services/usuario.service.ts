import bcrypt from 'bcryptjs';
import { Prisma, Rol } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { normalizarCedula } from '../utils/cedula';

export interface UsuarioListado {
  id: number;
  cedula: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  creadoEn: Date;
}

function aUsuarioListado(usuario: {
  id: number;
  cedula: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  creadoEn: Date;
}): UsuarioListado {
  return {
    id: usuario.id,
    cedula: usuario.cedula,
    nombre: usuario.nombre,
    rol: usuario.rol,
    activo: usuario.activo,
    creadoEn: usuario.creadoEn,
  };
}

export async function listarUsuarios(): Promise<UsuarioListado[]> {
  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
  });

  return usuarios.map(aUsuarioListado);
}

export async function crearUsuario(datos: {
  cedula: string;
  nombre: string;
  password: string;
  rol: Rol;
}): Promise<UsuarioListado> {
  const cedula = normalizarCedula(datos.cedula);

  if (!cedula) {
    throw new AppError(400, 'La cédula debe contener entre 5 y 9 dígitos');
  }

  const existente = await prisma.usuario.findUnique({ where: { cedula } });
  if (existente) {
    throw new AppError(409, 'Ya existe un usuario con esa cédula');
  }

  const passwordHash = await bcrypt.hash(datos.password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      cedula,
      nombre: datos.nombre.trim(),
      passwordHash,
      rol: datos.rol,
      activo: true,
    },
  });

  return aUsuarioListado(usuario);
}

export async function actualizarUsuario(
  id: number,
  datos: {
    nombre?: string;
    password?: string;
    rol?: Rol;
    activo?: boolean;
  },
): Promise<UsuarioListado> {
  const actual = await prisma.usuario.findUnique({ where: { id } });

  if (!actual) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  const pierdeRolRoot = actual.rol === Rol.ROOT && datos.rol !== undefined && datos.rol !== Rol.ROOT;
  const seDesactiva = actual.rol === Rol.ROOT && datos.activo === false;

  if (pierdeRolRoot || seDesactiva) {
    const rootsActivos = await prisma.usuario.count({
      where: { rol: Rol.ROOT, activo: true },
    });

    if (rootsActivos <= 1) {
      throw new AppError(400, 'Debe existir al menos un usuario ROOT activo');
    }
  }

  const data: Prisma.UsuarioUpdateInput = {};

  if (datos.nombre !== undefined) data.nombre = datos.nombre.trim();
  if (datos.rol !== undefined) data.rol = datos.rol;
  if (datos.activo !== undefined) data.activo = datos.activo;
  if (datos.password) data.passwordHash = await bcrypt.hash(datos.password, 10);

  const usuario = await prisma.usuario.update({ where: { id }, data });

  return aUsuarioListado(usuario);
}
