import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { env } from '../config/env';
import { ConstanciaData } from './constancia.service';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_HEIGHT - 70;

const VINOTINTO = '#7B1E3B';
const VINOTINTO_DARK = '#5A1229';
const VINOTINTO_SOFT = '#FBF2F5';
const BORDER = '#D8C2CA';
const TEXT = '#1F2937';
const MUTED = '#6B7280';

const TABLE_FONT_SIZE = 7.2;
const CELL_PADDING = 3;

interface Columna {
  key: keyof ConstanciaData['materias'][number];
  label: string;
  width: number;
  align: 'left' | 'center' | 'right';
}

const COLUMNAS: Columna[] = [
  { key: 'codigo', label: 'Código', width: 42, align: 'left' },
  { key: 'asignatura', label: 'Asignatura', width: 125, align: 'left' },
  { key: 'uc', label: 'UC', width: 24, align: 'center' },
  { key: 'periodo', label: 'Período', width: 46, align: 'center' },
  { key: 'seccion', label: 'Sección', width: 32, align: 'center' },
  { key: 'nota', label: 'Nota', width: 28, align: 'center' },
  { key: 'nota_letras', label: 'En letras', width: 58, align: 'left' },
  { key: 'aprobada', label: 'Aprobada', width: 40, align: 'center' },
  { key: 'profesor', label: 'Profesor', width: 120, align: 'left' },
];

function leerLogo(ruta: string): Buffer | null {
  const absoluta = path.resolve(ruta);

  if (!fs.existsSync(absoluta)) {
    return null;
  }

  return fs.readFileSync(absoluta);
}

function valorCelda(materia: ConstanciaData['materias'][number], clave: Columna['key']): string {
  const valor = materia[clave];
  return valor === null || valor === undefined ? '' : String(valor);
}

function dibujarLogo(
  doc: PDFKit.PDFDocument,
  buffer: Buffer,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
  align?: 'center' | 'right',
): void {
  doc.image(buffer, x, y, {
    fit: [maxW, maxH],
    ...(align ? { align } : {}),
    valign: 'center',
  });
}

function dibujarEncabezadoInstitucional(doc: PDFKit.PDFDocument, data: ConstanciaData): number {
  const logoUC = leerLogo(env.LOGO_UC_PATH);
  const logoFaces = leerLogo(env.LOGO_FACES_PATH);

  if (logoUC) {
    dibujarLogo(doc, logoUC, MARGIN, 32, 62, 72);
  }

  if (logoFaces) {
    dibujarLogo(doc, logoFaces, PAGE_WIDTH - MARGIN - 95, 42, 95, 52, 'right');
  }

  const centroX = 115;
  const centroAncho = CONTENT_WIDTH - 175;

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(VINOTINTO)
    .text('UNIVERSIDAD DE CARABOBO', centroX, 34, { width: centroAncho, align: 'center' });

  doc
    .fontSize(8.5)
    .fillColor(TEXT)
    .text('FACULTAD DE CIENCIAS ECONÓMICAS Y SOCIALES', centroX, 50, {
      width: centroAncho,
      align: 'center',
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(MUTED)
    .text('COORDINACIÓN DE POSTGRADO', centroX, 64, { width: centroAncho, align: 'center' });

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(VINOTINTO_DARK)
    .text('CONSTANCIA DE NOTAS', centroX, 82, { width: centroAncho, align: 'center' });

  doc
    .moveTo(centroX, 104)
    .lineTo(centroX + centroAncho, 104)
    .lineWidth(1.2)
    .strokeColor(VINOTINTO)
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(MUTED)
    .text(
      `Emitida para ${data.nombres} · ${data.cedula_formateada}`,
      centroX,
      128,
      { width: centroAncho, align: 'center' },
    );

  return 130;
}

function dibujarEncabezadoTabla(doc: PDFKit.PDFDocument, y: number): number {
  const altura = 20;
  let x = MARGIN;

  doc.rect(MARGIN, y, CONTENT_WIDTH, altura).fill(VINOTINTO);

  for (const columna of COLUMNAS) {
    doc
      .font('Helvetica-Bold')
      .fontSize(TABLE_FONT_SIZE)
      .fillColor('#FFFFFF')
      .text(columna.label, x + CELL_PADDING, y + 6, {
        width: columna.width - CELL_PADDING * 2,
        align: columna.align,
        lineBreak: false,
      });
    x += columna.width;
  }

  doc
    .rect(MARGIN, y, CONTENT_WIDTH, altura)
    .lineWidth(0.6)
    .strokeColor(VINOTINTO_DARK)
    .stroke();

  return y + altura;
}

function alturaFila(doc: PDFKit.PDFDocument, materia: ConstanciaData['materias'][number]): number {
  let mayor = 0;

  doc.font('Helvetica').fontSize(TABLE_FONT_SIZE);

  for (const columna of COLUMNAS) {
    const texto = valorCelda(materia, columna.key) || ' ';
    const altura = doc.heightOfString(texto, {
      width: columna.width - CELL_PADDING * 2,
      align: columna.align,
    });
    mayor = Math.max(mayor, altura);
  }

  return Math.max(18, mayor + CELL_PADDING * 2);
}

function dibujarFila(
  doc: PDFKit.PDFDocument,
  materia: ConstanciaData['materias'][number],
  y: number,
  indice: number,
): number {
  const altura = alturaFila(doc, materia);
  let x = MARGIN;

  if (indice % 2 === 1) {
    doc.rect(MARGIN, y, CONTENT_WIDTH, altura).fill(VINOTINTO_SOFT);
  }

  for (const columna of COLUMNAS) {
    const texto = valorCelda(materia, columna.key);
    const aprobada = columna.key === 'aprobada';

    doc
      .font(aprobada && texto === 'NO' ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(TABLE_FONT_SIZE)
      .fillColor(aprobada && texto === 'NO' ? '#B91C1C' : TEXT)
      .text(texto, x + CELL_PADDING, y + CELL_PADDING, {
        width: columna.width - CELL_PADDING * 2,
        align: columna.align,
      });

    doc
      .moveTo(x, y)
      .lineTo(x, y + altura)
      .lineWidth(0.4)
      .strokeColor(BORDER)
      .stroke();

    x += columna.width;
  }

  doc
    .moveTo(MARGIN, y + altura)
    .lineTo(MARGIN + CONTENT_WIDTH, y + altura)
    .lineWidth(0.4)
    .strokeColor(BORDER)
    .stroke();

  doc
    .moveTo(MARGIN + CONTENT_WIDTH, y)
    .lineTo(MARGIN + CONTENT_WIDTH, y + altura)
    .lineWidth(0.4)
    .strokeColor(BORDER)
    .stroke();

  return y + altura;
}

export function generarConstanciaPdf(data: ConstanciaData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true,
      info: {
        Title: `Constancia de Notas - ${data.nombres}`,
        Author: 'FACES - Universidad de Carabobo',
        Subject: 'Constancia de notas de postgrado',
        Creator: 'Sistema de Constancias FACES-UC',
      },
    });

    const partes: Buffer[] = [];
    doc.on('data', (parte: Buffer) => partes.push(parte));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    let y = dibujarEncabezadoInstitucional(doc, data);

    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(TEXT)
      .text(
        'Quien suscribe, en su carácter de autoridad académica de la Coordinación de Postgrado de la Facultad de Ciencias Económicas y Sociales de la Universidad de Carabobo, hace constar que el (la) ciudadano(a) ',
        MARGIN,
        y,
        { width: CONTENT_WIDTH, align: 'justify' },
      );

    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(VINOTINTO_DARK)
      .text(data.nombres, MARGIN, doc.y + 2, { width: CONTENT_WIDTH });

    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(TEXT)
      .text(
        `titular de la Cédula de Identidad ${data.cedula_formateada}, cursó y aprobó las asignaturas que se indican a continuación:`,
        MARGIN,
        doc.y + 2,
        { width: CONTENT_WIDTH, align: 'justify' },
      );

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(VINOTINTO_DARK)
      .text('Programa: ', MARGIN, doc.y + 8, { continued: true })
      .font('Helvetica-Bold')
      .fillColor(TEXT)
      .text(`${data.programa} (Código ${data.programa_codigo})`);

    y = doc.y + 10;
    y = dibujarEncabezadoTabla(doc, y);

    data.materias.forEach((materia, indice) => {
      const altura = alturaFila(doc, materia);

      if (y + altura > BOTTOM_LIMIT) {
        doc.addPage();
        y = MARGIN;
        y = dibujarEncabezadoTabla(doc, y);
      }

      y = dibujarFila(doc, materia, y, indice);
    });

    if (y + 150 > BOTTOM_LIMIT) {
      doc.addPage();
      y = MARGIN;
    }

    y += 16;

    const resumen = [
      ['Total de asignaturas', String(data.total_asignaturas)],
      ['Créditos cursados', String(data.total_creditos)],
      ['Créditos aprobados', String(data.creditos_aprobados)],
      ['Índice académico', data.indice_academico],
    ];

    for (const [etiqueta, valor] of resumen) {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(VINOTINTO_DARK)
        .text(`${etiqueta}: `, MARGIN, y, { continued: true })
        .font('Helvetica-Bold')
        .fillColor(TEXT)
        .text(valor);
      y = doc.y + 2;
    }

    y += 10;

    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(TEXT)
      .text(
        `Constancia que se expide a los fines que estime convenientes, en la ciudad de Valencia, a los ${data.fecha_actual}.`,
        MARGIN,
        y,
        { width: CONTENT_WIDTH, align: 'justify' },
      );

    if (doc.y + 110 > BOTTOM_LIMIT) {
      doc.addPage();
      y = MARGIN;
    } else {
      y = doc.y + 24;
    }

    const firmaAncho = 210;
    const firmaX = (PAGE_WIDTH - firmaAncho) / 2;

    doc
      .moveTo(firmaX, y)
      .lineTo(firmaX + firmaAncho, y)
      .lineWidth(0.8)
      .strokeColor(TEXT)
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(TEXT)
      .text('Coordinación de Postgrado', firmaX, y + 6, { width: firmaAncho, align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(MUTED)
      .text('FACES - Universidad de Carabobo', firmaX, y + 19, {
        width: firmaAncho,
        align: 'center',
      });

    const rango = doc.bufferedPageRange();

    for (let pagina = rango.start; pagina < rango.start + rango.count; pagina += 1) {
      doc.switchToPage(pagina);
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(MUTED)
        .text(
          `Documento generado automáticamente · Página ${pagina + 1} de ${rango.count}`,
          MARGIN,
          PAGE_HEIGHT - 34,
          { width: CONTENT_WIDTH, align: 'center', lineBreak: false },
        );
    }

    doc.end();
  });
}
