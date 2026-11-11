import bcrypt from 'bcryptjs';
import { Prisma, Rol } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { normalizarCedula, esCedulaValida } from '../utils/cedula';

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
  email: string;
  password: string;
  rol: Rol;
}): Promise<UsuarioListado> {
  const cedula = normalizarCedula(datos.cedula);

  if (!cedula || !esCedulaValida(cedula)) {
    throw new AppError(400, 'La cédula debe contener entre 5 y 9 dígitos numéricos');
  }

  const existenteCedula = await prisma.usuario.findUnique({ where: { cedula } });
  if (existenteCedula) {
    throw new AppError(409, 'Ya existe un usuario con esa cédula');
  }

  const existenteEmail = await prisma.usuario.findUnique({ where: { email: datos.email } });
  if (existenteEmail) {
    throw new AppError(409, 'Ya existe un usuario con ese correo electrónico');
  }

  const passwordHash = await bcrypt.hash(datos.password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      cedula,
      nombre: datos.nombre.trim(),
      email: datos.email.trim().toLowerCase(),
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
    email?: string;
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

  if (datos.email !== undefined && datos.email !== actual.email) {
    const existenteEmail = await prisma.usuario.findUnique({ where: { email: datos.email } });
    if (existenteEmail) {
      throw new AppError(409, 'Ya existe un usuario con ese correo electrónico');
    }
  }

  const data: Prisma.UsuarioUpdateInput = {};

  if (datos.nombre !== undefined) data.nombre = datos.nombre.trim();
  if (datos.email !== undefined) data.email = datos.email.trim().toLowerCase();
  if (datos.rol !== undefined) data.rol = datos.rol;
  if (datos.activo !== undefined) data.activo = datos.activo;
  if (datos.password) data.passwordHash = await bcrypt.hash(datos.password, 10);

  const usuario = await prisma.usuario.update({ where: { id }, data });

  return aUsuarioListado(usuario);
}
