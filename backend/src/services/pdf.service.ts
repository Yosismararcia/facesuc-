import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { env } from '../config/env';
import { ConstanciaData } from './constancia.service';

// --- Especificaciones exactas de la plantilla Notas.docx (twips -> puntos) ---
// 1 twip = 1/20 punto
const PAGE_WIDTH = 612;   // Letter
const PAGE_HEIGHT = 792;  // Letter

// Márgenes de la plantilla: top 1417, bottom 1417, left 1701, right 1701 twips
const MARGIN_TOP = 1417 / 20;    // 70.85 pt
const MARGIN_BOTTOM = 1417 / 20; // 70.85 pt
const MARGIN_LEFT = 1701 / 20;   // 85.05 pt
const MARGIN_RIGHT = 1701 / 20;  // 85.05 pt

const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const FONT = 'Helvetica'; // equivalente a Arial

function leerLogo(ruta: string): Buffer | null {
  const absoluta = path.resolve(ruta);
  if (!fs.existsSync(absoluta)) {
    return null;
  }
  return fs.readFileSync(absoluta);
}

export function generarConstanciaPdf(data: ConstanciaData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'letter',
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

    // --- Logos encabezado (misma posición que Word) ---
    const logoUC = leerLogo(env.LOGO_UC_PATH);
    const logoFaces = leerLogo(env.LOGO_FACES_PATH);

    const logoSize = 40;

    if (logoUC) {
      doc.image(logoUC, MARGIN_LEFT, MARGIN_TOP - 8, {
        width: logoSize,
        height: logoSize,
      });
    }

    if (logoFaces) {
      doc.image(logoFaces, PAGE_WIDTH - MARGIN_RIGHT - logoSize, MARGIN_TOP - 8, {
        width: logoSize,
        height: logoSize,
      });
    }

    // --- Título principal: REPORTE INTERNO DE NOTAS ---
    // Plantilla: centrado, negrita, sz:26 (13pt), fuente Arial
    doc
      .font(FONT)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('REPORTE INTERNO DE NOTAS', MARGIN_LEFT, MARGIN_TOP + 5, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    // --- Párrafo introductorio ---
    // Plantilla: justificado, normal, sz:default (11pt), fuente Arial
    doc
      .font(FONT)
      .fontSize(11)
      .font('Helvetica')
      .text(
        `Reporte interno de Notas para la ciudadana ${data.nombres}, titular de la cedula de identidad ${data.cedula_formateada}, cursó las siguientes asignaturas correspondiente al programa:`,
        MARGIN_LEFT,
        doc.y + 6,
        { width: CONTENT_WIDTH, align: 'justify' },
      );

    // --- Programa ---
    // Plantilla: centrado, negrita, sz:26 (13pt)
    doc
      .font(FONT)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(data.programa, MARGIN_LEFT, doc.y + 6, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    // --- Espacio antes tabla ---
    doc.moveDown(0.3);

    // --- Tabla de materias ---
    // Plantilla: 7 columnas, encabezado negrita sz:20 (10pt) centrado, datos sz:15 (7.5pt)
    const TABLE_START_Y = doc.y;
    const COLUMNS = 7;
    const colWidth = CONTENT_WIDTH / COLUMNS;

    const headers = ['Asignatura', 'Niv.', 'UC', 'Periodo', 'Sec.', 'Notas', 'Notas en letras'];
    const aligns = ['center', 'center', 'center', 'center', 'left', 'center', 'center'];

    let y = TABLE_START_Y;

    // Encabezado de tabla
    headers.forEach((header, i) => {
      doc
        .font(FONT)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(header, MARGIN_LEFT + i * colWidth, y, {
          width: colWidth,
          align: aligns[i] as 'center' | 'left' | 'right' | 'justify',
        });
    });

    // Línea bajo encabezado
    doc
      .lineWidth(0.5)
      .moveTo(MARGIN_LEFT, y + 13)
      .lineTo(MARGIN_LEFT + CONTENT_WIDTH, y + 13)
      .stroke();

    y += 15;

    // Filas de datos
    data.materias.forEach((materia, index) => {
      const rowHeight = 13;

      const values = [
        materia.asignatura,
        String(materia.nivel),
        String(materia.uc),
        materia.periodo,
        materia.seccion || '',
        materia.nota,
        materia.nota_letras,
      ];

      values.forEach((val, i) => {
        doc
          .font(FONT)
          .fontSize(7.5)
          .font('Helvetica')
          .text(val, MARGIN_LEFT + i * colWidth, y, {
            width: colWidth,
            align: aligns[i] as 'center' | 'left' | 'right' | 'justify',
          });
      });

      // Línea entre filas
      if (index < data.materias.length - 1) {
        doc
          .lineWidth(0.3)
          .moveTo(MARGIN_LEFT, y + rowHeight)
          .lineTo(MARGIN_LEFT + CONTENT_WIDTH, y + rowHeight)
          .stroke();
      }

      y += rowHeight;
    });

    // --- Tabla de resumen ---
    // Plantilla: 2 columnas, etiqueta derecha negrita sz:16 (8pt), valor centro negrita sz:16 (8pt)
    y += 10;

    const resumen = [
      ['Total de créditos Cursados:', String(data.total_creditos)],
      ['Total de créditos Aprobados:', String(data.creditos_aprobados)],
      ['Índice Académico:', data.indice_academico],
    ];

    const labelWidth = CONTENT_WIDTH * 0.7;
    const valueWidth = CONTENT_WIDTH * 0.3;

    resumen.forEach(([label, valor]) => {
      doc
        .font(FONT)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(label, MARGIN_LEFT, y, {
          width: labelWidth,
          align: 'right',
        });

      doc
        .font(FONT)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(valor, MARGIN_LEFT + labelWidth, y, {
          width: valueWidth,
          align: 'center',
        });

      y += 11;
    });

    // --- Profesor / Coordinación ---
    // Plantilla: centrado, negrita, sz:default (11pt)
    y += 5;

    doc
      .font(FONT)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(data.profesor_coordinacion, MARGIN_LEFT, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    y += 13;

    // --- Dirección ---
    // Plantilla: centrado, negrita, sz:20 (10pt)
    doc
      .font(FONT)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Dirección de Asuntos Estudiantiles – Postgrado', MARGIN_LEFT, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    y += 18;

    // --- Párrafo final ---
    // Plantilla: centrado, normal, sz:26 (13pt)
    doc
      .font(FONT)
      .fontSize(13)
      .font('Helvetica')
      .text(
        `Constancia que se expide a los fines que estime convenientes, en la ciudad de Valencia, a los ${data.fecha_actual}.`,
        MARGIN_LEFT,
        y,
        { width: CONTENT_WIDTH, align: 'center' },
      );

    // Número de página discreto al pie
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i += 1) {
      doc.switchToPage(i);
      doc
        .font(FONT)
        .fontSize(7)
        .font('Helvetica')
        .text(
          `Página ${i + 1} de ${totalPages}`,
          MARGIN_LEFT,
          PAGE_HEIGHT - 35,
          {
            width: CONTENT_WIDTH,
            align: 'center',
          },
        );
    }

    doc.end();
  });
}
