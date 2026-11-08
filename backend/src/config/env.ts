import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  TEMPLATE_PATH: z.string().default('./templates/Notas.docx'),
  LOGO_UC_PATH: z.string().default('./templates/logos/uc.png'),
  LOGO_FACES_PATH: z.string().default('./templates/logos/faces.png'),
  CORS_ORIGIN: z.string().default('*'),
  ROOT_CEDULA: z.string().optional(),
  ROOT_EMAIL: z.string().email().optional(),
  ROOT_PASSWORD: z.string().optional(),
  ROOT_NOMBRE: z.string().default('Root FACES UC'),
  ADMIN_CEDULA: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NOMBRE: z.string().default('Administrador FACES'),
  CSV_PATH: z.string().default('./data/baseDeDatosSistemaConstancia.csv'),
  IMPORT_CSV_ON_START: z.string().default('false'),
  PROFESOR_COORDINACION: z.string().default('Coordinación de Postgrado'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
