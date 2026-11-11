import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

export interface ConsultaRegistrada {
  id: number;
  estudianteId: number;
  usuarioId: number;
  fechaConsulta: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export async function registrarConsulta(
  cedula: string,
  usuarioId: number,
  ipAddress?: string,
  userAgent?: string,
): Promise<ConsultaRegistrada> {
  const estudiante = await prisma.estudiante.findUnique({
    where: { cedula },
  });

  if (!estudiante) {
    throw new AppError(404, 'Estudiante no encontrado');
  }

  const consulta = await prisma.consultaEstudiante.create({
    data: {
      estudianteId: estudiante.id,
      usuarioId,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    },
  });

  return {
    id: consulta.id,
    estudianteId: consulta.estudianteId,
    usuarioId: consulta.usuarioId,
    fechaConsulta: consulta.fechaConsulta,
    ipAddress: consulta.ipAddress,
    userAgent: consulta.userAgent,
  };
}

export async function listarConsultasEstudiante(cedula: string): Promise<ConsultaRegistrada[]> {
  const estudiante = await prisma.estudiante.findUnique({
    where: { cedula },
  });

  if (!estudiante) {
    throw new AppError(404, 'Estudiante no encontrado');
  }

  const consultas = await prisma.consultaEstudiante.findMany({
    where: { estudianteId: estudiante.id },
    orderBy: { fechaConsulta: 'desc' },
  });

  return consultas.map((c: { id: number; estudianteId: number; usuarioId: number; fechaConsulta: Date; ipAddress: string | null; userAgent: string | null }) => ({
    id: c.id,
    estudianteId: c.estudianteId,
    usuarioId: c.usuarioId,
    fechaConsulta: c.fechaConsulta,
    ipAddress: c.ipAddress,
    userAgent: c.userAgent,
  }));
}