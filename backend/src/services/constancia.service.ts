import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import { esCedulaValida, formatearCedula, normalizarCedula } from '../utils/cedula';
import { formatearIndice, formatearNota } from '../utils/format';
import { numeroALetras } from '../utils/numberToWords';

export interface MateriaConstancia {
  codigo: string;
  asignatura: string;
  nivel: number;
  uc: number;
  periodo_lectivo: string;
  anno_lectivo: string;
  periodo: string;
  seccion: string;
  nota: string;
  nota_letras: string;
  aprobada: string;
  profesor: string;
  calculo_promedio: string;
}

export interface ConstanciaData {
  nombres: string;
  cedula: string;
  cedula_formateada: string;
  programa: string;
  programa_codigo: string;
  total_asignaturas: number;
  total_creditos: number;
  creditos_aprobados: number;
  indice_academico: string;
  fecha_actual: string;
  ultimo_periodo: string;
  profesor_coordinacion: string;
  materias: MateriaConstancia[];
}

function fechaActualLarga(): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

/**
 * Obtiene y prepara toda la información que se inyectará en la plantilla
 * Notas.docx para un estudiante identificado por su cédula.
 */
export async function obtenerConstancia(cedulaIngresada: string): Promise<ConstanciaData> {
  const cedula = normalizarCedula(cedulaIngresada);

  if (!esCedulaValida(cedula)) {
    throw new AppError(400, 'La cédula debe contener entre 5 y 9 dígitos');
  }

  const estudiante = await prisma.estudiante.findUnique({
    where: { cedula },
    include: {
      programa: true,
      notas: {
        include: { asignatura: true },
        orderBy: [
          { annoLectivo: 'asc' },
          { periodoLectivo: 'asc' },
          { asignatura: { codigo: 'asc' } },
        ],
      },
    },
  });

  if (!estudiante) {
    throw new AppError(404, `No se encontró un estudiante con la cédula ${formatearCedula(cedula)}`);
  }

  const materias: MateriaConstancia[] = estudiante.notas.map((nota) => ({
    codigo: nota.asignatura.codigo,
    asignatura: nota.asignatura.descripcion,
    nivel: nota.asignatura.nivel,
    uc: nota.asignatura.uc,
    periodo_lectivo: nota.periodoLectivo,
    anno_lectivo: nota.annoLectivo,
    periodo: `${nota.periodoLectivo}-${nota.annoLectivo}`,
    seccion: nota.seccion,
    nota: formatearNota(nota.notaFinal),
    nota_letras: numeroALetras(nota.notaFinal),
    aprobada: nota.aprobada ? 'SI' : 'NO',
    profesor: nota.nombreProfesor ?? '',
    calculo_promedio:
      nota.calculoPromedio === null || nota.calculoPromedio === undefined
        ? ''
        : formatearNota(nota.calculoPromedio),
  }));

  const totalCreditos = materias.reduce((acumulado, materia) => acumulado + materia.uc, 0);

  const creditosAprobados = estudiante.notas.reduce(
    (acumulado, nota) => acumulado + (nota.aprobada ? nota.asignatura.uc : 0),
    0,
  );

  // Índice académico = promedio ponderado por unidades de crédito.
  const sumaPonderada = estudiante.notas.reduce(
    (acumulado, nota) => acumulado + nota.notaFinal * nota.asignatura.uc,
    0,
  );
  const indiceAcademico = totalCreditos > 0 ? sumaPonderada / totalCreditos : 0;

  const ultimaNota = estudiante.notas[estudiante.notas.length - 1];

  return {
    nombres: estudiante.nombres,
    cedula,
    cedula_formateada: formatearCedula(cedula),
    programa: estudiante.programa.descripcion,
    programa_codigo: estudiante.programa.codigo,
    total_asignaturas: materias.length,
    total_creditos: totalCreditos,
    creditos_aprobados: creditosAprobados,
    indice_academico: formatearIndice(indiceAcademico),
    fecha_actual: fechaActualLarga(),
    ultimo_periodo: ultimaNota ? ultimaNota.periodoLectivo : '',
    profesor_coordinacion: env.PROFESOR_COORDINACION,
    materias,
  };
}
