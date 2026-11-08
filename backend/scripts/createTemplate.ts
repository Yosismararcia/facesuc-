import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

/**
 * Genera una plantilla base Notas.docx con las etiquetas que consume
 * docxtemplater. Si ya existe una plantilla personalizada, NO se sobrescribe
 * salvo que se pase el argumento --force.
 *
 * Uso:
 *   npm run template:create
 *   npm run template:create -- ./templates/MiPlantilla.docx --force
 */

const ANCHOS = [900, 2000, 500, 1000, 700, 600, 1400, 700, 1200];
const BORDE = { style: BorderStyle.SINGLE, size: 4, color: 'D8C2CA' };
const SIN_BORDE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const VINOTINTO = '7B1E3B';
const VINOTINTO_OSCURO = '5A1229';
const VINOTINTO_SUAVE = 'FBF2F5';

const BORDES_TABLA = {
  top: BORDE,
  bottom: BORDE,
  left: BORDE,
  right: BORDE,
  insideHorizontal: BORDE,
  insideVertical: BORDE,
};

function celda(
  texto: string,
  opciones: {
    bold?: boolean;
    alignment?: any;
    ancho?: number;
    fill?: string;
    color?: string;
  } = {},
): TableCell {
  return new TableCell({
    width: opciones.ancho
      ? { size: opciones.ancho, type: WidthType.DXA }
      : undefined,
    shading: opciones.fill ? { fill: opciones.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opciones.alignment,
        children: [
          new TextRun({
            text: texto,
            bold: opciones.bold ?? true,
            color: opciones.color,
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function logoRun(
  ruta: string,
  ancho: number,
  alto: number,
  descripcion: string,
): ImageRun | null {
  const absoluta = path.resolve(ruta);

  if (!fs.existsSync(absoluta)) {
    return null;
  }

  return new ImageRun({
    type: 'png',
    data: fs.readFileSync(absoluta),
    transformation: { width: ancho, height: alto },
    altText: {
      name: descripcion,
      title: descripcion,
      description: descripcion,
    },
  });
}

function celdaLogo(logo: ImageRun | null, ancho: number, alineacion: any): TableCell {
  return new TableCell({
    width: { size: ancho, type: WidthType.DXA },
    borders: {
      top: SIN_BORDE,
      bottom: SIN_BORDE,
      left: SIN_BORDE,
      right: SIN_BORDE,
    },
    verticalAlign: 'center',
    children: [
      new Paragraph({
        alignment: alineacion,
        children: logo ? [logo] : [],
      }),
    ],
  });
}

function filaEncabezado(): TableRow {
  const columnas = [
    'Código',
    'Asignatura',
    'UC',
    'Período',
    'Sección',
    'Nota',
    'En letras',
    'Aprobada',
    'Profesor',
  ];

  return new TableRow({
    tableHeader: true,
    children: columnas.map((columna, indice) =>
      celda(columna, {
        bold: true,
        alignment: AlignmentType.CENTER,
        ancho: ANCHOS[indice],
        fill: VINOTINTO,
        color: 'FFFFFF',
      }),
    ),
  });
}

function filaMaterias(): TableRow {
  return new TableRow({
    children: [
      celda('{{#materias}}{{codigo}}', { ancho: ANCHOS[0] }),
      celda('{{asignatura}}', { ancho: ANCHOS[1] }),
      celda('{{uc}}', { alignment: AlignmentType.CENTER, ancho: ANCHOS[2] }),
      celda('{{periodo}}', { alignment: AlignmentType.CENTER, ancho: ANCHOS[3] }),
      celda('{{seccion}}', { alignment: AlignmentType.CENTER, ancho: ANCHOS[4] }),
      celda('{{nota}}', { alignment: AlignmentType.CENTER, ancho: ANCHOS[5] }),
      celda('{{nota_letras}}', { ancho: ANCHOS[6] }),
      celda('{{aprobada}}', { alignment: AlignmentType.CENTER, ancho: ANCHOS[7] }),
      celda('{{profesor}}{{/materias}}', { ancho: ANCHOS[8] }),
    ],
  });
}

async function main(): Promise<void> {
  const argumentos = process.argv.slice(2);
  const force = argumentos.includes('--force');
  const rutaArgumento = argumentos.find((argumento) => argumento !== '--force');

  const destino = path.resolve(
    rutaArgumento ?? process.env.TEMPLATE_PATH ?? './templates/Notas.docx',
  );

  if (fs.existsSync(destino) && !force) {
    console.log(
      `[TEMPLATE] Ya existe ${destino}. No se sobrescribe. Use --force para regenerarla.`,
    );
    return;
  }

  const parrafosEncabezado = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: 'UNIVERSIDAD DE CARABOBO',
          bold: true,
          size: 26,
          color: VINOTINTO,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: 'FACULTAD DE CIENCIAS ECONÓMICAS Y SOCIALES',
          bold: true,
          size: 22,
          color: VINOTINTO_OSCURO,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: 'COORDINACIÓN DE POSTGRADO', bold: true, size: 20, color: '6B7280' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'CONSTANCIA DE NOTAS',
          bold: true,
          size: 30,
          underline: {},
          color: VINOTINTO_OSCURO,
        }),
      ],
    }),
  ];

  const logoUC = logoRun(
    process.env.LOGO_UC_PATH ?? './templates/logos/uc.png',
    55,
    73,
    'Logo Universidad de Carabobo',
  );
  const logoFaces = logoRun(
    process.env.LOGO_FACES_PATH ?? './templates/logos/faces.png',
    86,
    49,
    'Logo FACES',
  );

  const encabezadoInstitucional = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [1200, 6960, 1200],
    borders: {
      top: SIN_BORDE,
      bottom: SIN_BORDE,
      left: SIN_BORDE,
      right: SIN_BORDE,
      insideHorizontal: SIN_BORDE,
      insideVertical: SIN_BORDE,
    },
    rows: [
      new TableRow({
        children: [
          celdaLogo(logoUC, 1200, AlignmentType.LEFT),
          new TableCell({
            width: { size: 6960, type: WidthType.DXA },
            borders: {
              top: SIN_BORDE,
              bottom: SIN_BORDE,
              left: SIN_BORDE,
              right: SIN_BORDE,
            },
            verticalAlign: 'center',
            children: parrafosEncabezado,
          }),
          celdaLogo(logoFaces, 1200, AlignmentType.RIGHT),
        ],
      }),
    ],
  });

  const lineaInstitucional = new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: VINOTINTO },
    },
    spacing: { after: 220 },
  });

  const cuerpo = [
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text:
            'Quien suscribe, en su carácter de autoridad académica de la Coordinación de Postgrado ' +
            'de la Facultad de Ciencias Económicas y Sociales de la Universidad de Carabobo, hace ' +
            'constar que el (la) ciudadano(a) ',
          bold: true,
          size: 22,
        }),
        new TextRun({ text: '{{nombres}}', bold: true, size: 22 }),
        new TextRun({ text: ', titular de la Cédula de Identidad ', bold: true, size: 22 }),
        new TextRun({ text: '{{cedula_formateada}}', bold: true, size: 22 }),
        new TextRun({ text: ', cursó y aprobó las asignaturas que se indican a continuación:', bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: 'Programa: ', bold: true, size: 22, color: VINOTINTO }),
        new TextRun({ text: '{{programa}} (Código {{programa_codigo}})', bold: true, size: 22 }),
      ],
    }),
  ];

  const tabla = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: ANCHOS,
    borders: BORDES_TABLA,
    rows: [filaEncabezado(), filaMaterias()],
  });

  const resumen = [
    new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({ text: 'Total de asignaturas: ', bold: true, size: 22, color: VINOTINTO }),
        new TextRun({ text: '{{total_asignaturas}}', bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'Créditos cursados: ', bold: true, size: 22, color: VINOTINTO }),
        new TextRun({ text: '{{total_creditos}}', bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'Créditos aprobados: ', bold: true, size: 22, color: VINOTINTO }),
        new TextRun({ text: '{{creditos_aprobados}}', bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({ text: 'Índice académico: ', bold: true, size: 22, color: VINOTINTO }),
        new TextRun({ text: '{{indice_academico}}', bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text:
            'Constancia que se expide a los fines que estime convenientes, en la ciudad de ' +
            'Valencia, a los {{fecha_actual}}.',
          bold: true,
          size: 22,
        }),
      ],
    }),
  ];

  const firma = [
    new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '_________________________________', size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Coordinación de Postgrado', bold: true, size: 22, color: VINOTINTO_OSCURO })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'FACES - Universidad de Carabobo', bold: true, size: 20 }),
      ],
    }),
  ];

  const documento = new Document({
    creator: 'FACES - Universidad de Carabobo',
    title: 'Constancia de Notas',
    description: 'Plantilla para generación automática de constancias de notas',
    sections: [
      {
        properties: {},
        children: [encabezadoInstitucional, lineaInstitucional, ...cuerpo, tabla, ...resumen, ...firma],
      },
    ],
  });

  const buffer = await Packer.toBuffer(documento);

  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, buffer);

  console.log(`[TEMPLATE] Plantilla creada en ${destino}`);
}

main().catch((error) => {
  console.error('[TEMPLATE] Error:', error);
  process.exitCode = 1;
});
