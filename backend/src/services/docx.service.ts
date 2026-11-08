import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { ConstanciaData } from './constancia.service';

/**
 * Inyecta los datos del estudiante en la plantilla Word y devuelve el buffer
 * binario del archivo .docx resultante.
 *
 * Las etiquetas de la plantilla usan la sintaxis {{ etiqueta }} y el bucle
 * de asignaturas {{#materias}} ... {{/materias}}.
 */
export function generarConstanciaDocx(data: ConstanciaData): Buffer {
  const templatePath = path.resolve(env.TEMPLATE_PATH);

  if (!fs.existsSync(templatePath)) {
    throw new AppError(
      500,
      `No se encontró la plantilla Word en ${templatePath}. ` +
        'Ejecute "npm run template:create" o coloque su archivo Notas.docx.',
    );
  }

  const contenido = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(contenido);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    nullGetter: () => '',
  });

  try {
    doc.render(data);
  } catch (error) {
    console.error('[DOCX] Error al renderizar la plantilla:', error);
    throw new AppError(
      500,
      'No se pudo generar la constancia. Verifique que las etiquetas de Notas.docx sean correctas.',
    );
  }

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }) as Buffer;
}
