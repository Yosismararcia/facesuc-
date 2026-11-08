import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Rol } from '@prisma/client';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { normalizarCedula } from '../src/utils/cedula';

/**
 * Crea o actualiza los usuarios iniciales ROOT y ADMIN a partir de las
 * variables ROOT_* y ADMIN_*. Es idempotente: puede ejecutarse en cada arranque
 * del contenedor sin duplicar registros.
 */
async function upsertUsuario(
  cedulaIngresada: string,
  email: string | undefined,
  password: string,
  nombre: string,
  rol: Rol,
): Promise<void> {
  const cedula = normalizarCedula(cedulaIngresada);

  if (!cedula || password.length < 6) {
    console.warn(
      `[SEED] Usuario ${rol} omitido: cédula inválida o contraseña menor a 6 caracteres.`,
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuario = await prisma.usuario.upsert({
    where: { cedula },
    update: {
      email,
      nombre,
      passwordHash,
      rol,
      activo: true,
    },
    create: {
      cedula,
      email,
      nombre,
      passwordHash,
      rol,
      activo: true,
    },
  });

  console.log(
    `[SEED] Usuario ${rol} listo: ${usuario.nombre} (C.I. ${usuario.cedula})${email ? ` · Email: ${email}` : ''}`,
  );
}

async function main(): Promise<void> {
  const rootCedula = env.ROOT_CEDULA ?? '';
  const rootEmail = env.ROOT_EMAIL ?? undefined;
  const adminCedula = env.ADMIN_CEDULA ?? '';

  if (rootCedula && env.ROOT_PASSWORD) {
    await upsertUsuario(rootCedula, rootEmail, env.ROOT_PASSWORD, env.ROOT_NOMBRE, Rol.ROOT);
  } else {
    console.warn('[SEED] ROOT_CEDULA o ROOT_PASSWORD no están definidos. No se creó el usuario ROOT.');
  }

  if (adminCedula && env.ADMIN_PASSWORD) {
    if (rootCedula && normalizarCedula(adminCedula) === normalizarCedula(rootCedula)) {
      console.warn('[SEED] ADMIN_CEDULA coincide con ROOT_CEDULA. Se omite el usuario ADMIN.');
    } else {
      await upsertUsuario(adminCedula, undefined, env.ADMIN_PASSWORD, env.ADMIN_NOMBRE, Rol.ADMIN);
    }
  } else {
    console.warn('[SEED] ADMIN_CEDULA o ADMIN_PASSWORD no están definidos. No se creó el usuario ADMIN.');
  }
}

main()
  .catch((error) => {
    console.error('[SEED] Error creando los usuarios iniciales:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
