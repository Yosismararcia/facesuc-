import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import { normalizarCedula } from '../src/utils/cedula';
import { parseNumero } from '../src/utils/format';

/**
 * Importa el dataset desnormalizado baseDeDatosSistemaConstancia.csv a las
 * tablas normalizadas (3FN). Es idempotente gracias a skipDuplicates y a las
 * restricciones UNIQUE del esquema.
 *
 * Uso:
 *   npm run import:csv
 *   npm run import:csv -- ./data/mi_archivo.csv
 */

type Fila = Record<string, string>;

interface ProgramaCsv {
  codigo: string;
  descripcion: string;
}

interface EstudianteCsv {
  cedula: string;
  nombres: string;
  programaCodigo: string;
}

interface AsignaturaCsv {
  codigo: string;
  descripcion: string;
  nivel: number;
  uc: number;
  programaCodigo: string;
}

interface NotaCsv {
  cedula: string;
  codigoAsignatura: string;
  periodoLectivo: string;
  annoLectivo: string;
  seccion: string;
  notaFinal: number;
  aprobada: boolean;
  calculoPromedio: number | null;
  nombreProfesor: string;
}

const prisma = new PrismaClient();

function normalizarClave(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function pick(fila: Fila, ...alias: string[]): string {
  for (const clave of alias) {
    const valor = fila[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      return String(valor).trim();
    }
  }
  return '';
}

function parseAprobada(valor: string): boolean | null {
  const texto = valor.trim().toLowerCase();
  if (!texto) return null;
  if (['si', 'sí', 's', 'true', '1', 'a', 'aprobada', 'aprobado'].includes(texto)) return true;
  if (['no', 'n', 'false', '0', 'r', 'reprobada', 'reprobado'].includes(texto)) return false;
  return null;
}

function parseEntero(valor: string, defecto = 0): number {
  const numero = parseNumero(valor);
  return numero === null ? defecto : Math.trunc(numero);
}

function detectarDelimitador(contenido: string): string {
  const primeraLinea = contenido.split(/\r?\n/, 1)[0] ?? '';
  const puntoYComa = (primeraLinea.match(/;/g) ?? []).length;
  const coma = (primeraLinea.match(/,/g) ?? []).length;
  return puntoYComa > coma ? ';' : ',';
}

function enLotes<T>(items: T[], tamano = 1000): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < items.length; i += tamano) {
    lotes.push(items.slice(i, i + tamano));
  }
  return lotes;
}

async function main(): Promise<void> {
  const rutaCsv = path.resolve(
    process.argv[2] ?? process.env.CSV_PATH ?? './data/baseDeDatosSistemaConstancia.csv',
  );

  if (!fs.existsSync(rutaCsv)) {
    throw new Error(
      `No se encontró el archivo CSV en ${rutaCsv}. ` +
        'Copie "baseDeDatosSistemaConstancia.csv" en backend/data/ o indique la ruta como argumento.',
    );
  }

  console.log(`[IMPORT] Leyendo ${rutaCsv}`);
  const contenido = fs.readFileSync(rutaCsv, 'utf8');
  const delimitador = detectarDelimitador(contenido);

  const filas = parse(contenido, {
    columns: (encabezados: string[]) => encabezados.map(normalizarClave),
    delimiter: delimitador,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  }) as Fila[];

  console.log(`[IMPORT] Filas leídas: ${filas.length} (delimitador: "${delimitador}")`);

  const programas = new Map<string, ProgramaCsv>();
  const estudiantes = new Map<string, EstudianteCsv>();
  const asignaturas = new Map<string, AsignaturaCsv>();
  const notas: NotaCsv[] = [];
  const clavesNotas = new Set<string>();

  const omitidas = {
    sinCedula: 0,
    sinPrograma: 0,
    sinAsignatura: 0,
    sinNota: 0,
    duplicadas: 0,
  };

  for (const fila of filas) {
    const cedula = normalizarCedula(pick(fila, 'cedula', 'ci', 'c_i', 'cedula_identidad', 'cedula_de_identidad'));
    const nombres = pick(fila, 'nombres', 'nombre', 'nombres_y_apellidos', 'nombre_estudiante', 'estudiante');
    const codigoPrograma = pick(
      fila,
      'codigo_programa',
      'cod_programa',
      'programa_codigo',
      'codigo_del_programa',
    );
    const descPrograma = pick(
      fila,
      'desc_programa',
      'descripcion_programa',
      'nombre_programa',
      'programa',
    );
    const codigoAsignatura = pick(
      fila,
      'codigo_asignatura',
      'cod_asignatura',
      'asignatura_codigo',
      'codigo_de_la_asignatura',
    );
    const descAsignatura = pick(
      fila,
      'desc_asignatura',
      'descripcion_asignatura',
      'nombre_asignatura',
      'asignatura',
    );

    if (!cedula) {
      omitidas.sinCedula += 1;
      continue;
    }
    if (!codigoPrograma) {
      omitidas.sinPrograma += 1;
      continue;
    }
    if (!codigoAsignatura) {
      omitidas.sinAsignatura += 1;
      continue;
    }

    const notaFinal = parseNumero(
      pick(fila, 'nota_final', 'nota', 'calificacion', 'nota_definitiva'),
    );
    if (notaFinal === null) {
      omitidas.sinNota += 1;
      continue;
    }

    const periodoLectivo =
      pick(fila, 'periodo_lectivo', 'periodo', 'lapso') || 'SIN PERIODO';
    const annoLectivo =
      pick(fila, 'anno_lectivo', 'ano_lectivo', 'anno', 'ano') || 'SIN ANO';
    const seccion = pick(fila, 'seccion');

    if (!programas.has(codigoPrograma)) {
      programas.set(codigoPrograma, {
        codigo: codigoPrograma,
        descripcion: descPrograma || codigoPrograma,
      });
    }

    if (!estudiantes.has(cedula)) {
      estudiantes.set(cedula, {
        cedula,
        nombres: nombres || 'SIN NOMBRE',
        programaCodigo: codigoPrograma,
      });
    }

    if (!asignaturas.has(codigoAsignatura)) {
      asignaturas.set(codigoAsignatura, {
        codigo: codigoAsignatura,
        descripcion: descAsignatura || codigoAsignatura,
        nivel: parseEntero(pick(fila, 'nivel', 'semestre')),
        uc: parseEntero(pick(fila, 'uc', 'unidades_credito', 'creditos', 'unidades_de_credito')),
        programaCodigo: codigoPrograma,
      });
    }

    const claveNota = `${cedula}|${codigoAsignatura}|${periodoLectivo}|${annoLectivo}`;
    if (clavesNotas.has(claveNota)) {
      omitidas.duplicadas += 1;
      continue;
    }
    clavesNotas.add(claveNota);

    const aprobadaTexto = parseAprobada(pick(fila, 'aprobada', 'aprobado', 'estatus', 'status'));
    const calculoPromedio = parseNumero(pick(fila, 'calculo_promedio', 'promedio', 'indice'));

    notas.push({
      cedula,
      codigoAsignatura,
      periodoLectivo,
      annoLectivo,
      seccion,
      notaFinal,
      aprobada: aprobadaTexto ?? notaFinal >= 10,
      calculoPromedio,
      nombreProfesor: pick(fila, 'nombre_profesor', 'profesor', 'docente'),
    });
  }

  console.log(
    `[IMPORT] Programas: ${programas.size} | Estudiantes: ${estudiantes.size} | ` +
      `Asignaturas: ${asignaturas.size} | Notas: ${notas.length}`,
  );

  // 1) Programas
  for (const lote of enLotes([...programas.values()])) {
    await prisma.programa.createMany({ data: lote, skipDuplicates: true });
  }
  const programasDb = await prisma.programa.findMany({ select: { id: true, codigo: true } });
  const programaIdPorCodigo = new Map(programasDb.map((p) => [p.codigo, p.id]));

  // 2) Asignaturas
  const asignaturasData = [...asignaturas.values()]
    .map((asignatura) => {
      const programaId = programaIdPorCodigo.get(asignatura.programaCodigo);
      if (!programaId) return null;
      return {
        codigo: asignatura.codigo,
        descripcion: asignatura.descripcion,
        nivel: asignatura.nivel,
        uc: asignatura.uc,
        programaId,
      };
    })
    .filter(
      (asignatura): asignatura is {
        codigo: string;
        descripcion: string;
        nivel: number;
        uc: number;
        programaId: number;
      } => asignatura !== null,
    );

  for (const lote of enLotes(asignaturasData)) {
    await prisma.asignatura.createMany({ data: lote, skipDuplicates: true });
  }
  const asignaturasDb = await prisma.asignatura.findMany({
    select: { id: true, codigo: true },
  });
  const asignaturaIdPorCodigo = new Map(asignaturasDb.map((a) => [a.codigo, a.id]));

  // 3) Estudiantes
  const estudiantesData = [...estudiantes.values()]
    .map((estudiante) => {
      const programaId = programaIdPorCodigo.get(estudiante.programaCodigo);
      if (!programaId) return null;
      return {
        cedula: estudiante.cedula,
        nombres: estudiante.nombres,
        programaId,
      };
    })
    .filter(
      (estudiante): estudiante is {
        cedula: string;
        nombres: string;
        programaId: number;
      } => estudiante !== null,
    );

  for (const lote of enLotes(estudiantesData)) {
    await prisma.estudiante.createMany({ data: lote, skipDuplicates: true });
  }

  const estudiantesDb: { id: number; cedula: string }[] = [];
  for (const lote of enLotes(estudiantesData.map((e) => e.cedula))) {
    const filasDb = await prisma.estudiante.findMany({
      where: { cedula: { in: lote } },
      select: { id: true, cedula: true },
    });
    estudiantesDb.push(...filasDb);
  }
  const estudianteIdPorCedula = new Map(estudiantesDb.map((e) => [e.cedula, e.id]));

  // 4) Histórico de notas
  type NotaInsert = {
    estudianteId: number;
    asignaturaId: number;
    periodoLectivo: string;
    annoLectivo: string;
    seccion: string;
    notaFinal: number;
    aprobada: boolean;
    calculoPromedio: number | null;
    nombreProfesor: string | null;
  };

  const notasData = notas
    .map((nota): NotaInsert | null => {
      const estudianteId = estudianteIdPorCedula.get(nota.cedula);
      const asignaturaId = asignaturaIdPorCodigo.get(nota.codigoAsignatura);
      if (!estudianteId || !asignaturaId) return null;
      return {
        estudianteId,
        asignaturaId,
        periodoLectivo: nota.periodoLectivo,
        annoLectivo: nota.annoLectivo,
        seccion: nota.seccion,
        notaFinal: nota.notaFinal,
        aprobada: nota.aprobada,
        calculoPromedio: nota.calculoPromedio,
        nombreProfesor: nota.nombreProfesor || null,
      };
    })
    .filter((nota): nota is NotaInsert => nota !== null);

  let notasInsertadas = 0;
  for (const lote of enLotes(notasData, 500)) {
    const resultado = await prisma.historicoNota.createMany({
      data: lote,
      skipDuplicates: true,
    });
    notasInsertadas += resultado.count;
  }

  console.log('[IMPORT] Importación finalizada.');
  console.log(`[IMPORT] Notas nuevas insertadas: ${notasInsertadas}`);
  console.log(
    `[IMPORT] Filas omitidas -> sin cédula: ${omitidas.sinCedula}, ` +
      `sin programa: ${omitidas.sinPrograma}, sin asignatura: ${omitidas.sinAsignatura}, ` +
      `sin nota válida: ${omitidas.sinNota}, duplicadas: ${omitidas.duplicadas}`,
  );
}

main()
  .catch((error) => {
    console.error('[IMPORT] Error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
