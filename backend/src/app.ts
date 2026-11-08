import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import constanciasRoutes from './routes/constancias.routes';
import usuariosRoutes from './routes/usuarios.routes';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

app.disable('x-powered-by');

// --- Rate limiting para autenticación ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: env.NODE_ENV === 'production' ? 30 : 1000, // desarrollo: casi sin límite; producción: 30
  message: { error: 'Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => env.NODE_ENV === 'development' && req.ip === '127.0.0.1', // omitir en localhost dev
});

app.use('/api/auth/login', authLimiter);

// --- Headers de seguridad con Helmet ---
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: true },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: env.NODE_ENV === 'production' ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    } : false,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  }),
);

const corsOrigin =
  env.CORS_ORIGIN === '*'
    ? true
    : env.CORS_ORIGIN.split(',').map((origen) => origen.trim());

app.use(
  cors({
    origin: corsOrigin,
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
    credentials: false,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'facesuc-constancias', fecha: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/constancias', constanciasRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
