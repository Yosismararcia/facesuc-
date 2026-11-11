import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { obtenerConstancia } from '../services/constancia.service';
import { generarConstanciaDocx } from '../services/docx.service';
import { generarConstanciaPdf } from '../services/pdf.service';
import { registrarConsulta } from '../services/consulta.service';
import { AuthRequest } from '../types/auth';

const router = Router();

const MIME_DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MIME_PDF = 'application/pdf';

// ---------------------------------------------------------------------------
// Vista previa en JSON (usada por el panel React).
// GET /api/constancias/:cedula
// ---------------------------------------------------------------------------
router.get(
  '/:cedula',
  requireAuth,
  asyncHandler(async (req, res) => {
    const constancia = await obtenerConstancia(req.params.cedula);

    const { user } = req as AuthRequest;
    const usuarioId = Number(user?.sub);
    await registrarConsulta(
      constancia.cedula,
      usuarioId,
      req.ip ?? undefined,
      req.get('User-Agent') ?? undefined,
    ).catch(() => {
      // No fallar la consulta si el registro de auditoría falla
    });

    res.json(constancia);
  }),
);

// ---------------------------------------------------------------------------
// Descarga del archivo Word.
// GET /api/constancias/download/:cedula
// ---------------------------------------------------------------------------
router.get(
  '/download/:cedula',
  requireAuth,
  asyncHandler(async (req, res) => {
    const constancia = await obtenerConstancia(req.params.cedula);
    const buffer = generarConstanciaDocx(constancia);

    const cedulaSegura = constancia.cedula.replace(/[^0-9A-Za-z]/g, '');
    const filename = `Constancia_Notas_${cedulaSegura}.docx`;

    res.setHeader('Content-Type', MIME_DOCX);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(buffer);
  }),
);

// ---------------------------------------------------------------------------
// Descarga del archivo PDF.
// GET /api/constancias/pdf/:cedula
// ---------------------------------------------------------------------------
router.get(
  '/pdf/:cedula',
  requireAuth,
  asyncHandler(async (req, res) => {
    const constancia = await obtenerConstancia(req.params.cedula);
    const buffer = await generarConstanciaPdf(constancia);

    const cedulaSegura = constancia.cedula.replace(/[^0-9A-Za-z]/g, '');
    const filename = `Constancia_Notas_${cedulaSegura}.pdf`;

    res.setHeader('Content-Type', MIME_PDF);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(buffer);
  }),
);

export default router;
