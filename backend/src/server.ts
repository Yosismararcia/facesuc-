import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[FACES-UC] API escuchando en http://0.0.0.0:${env.PORT}`);
  console.log(`[FACES-UC] Entorno: ${env.NODE_ENV}`);
});

async function cerrar(senal: string): Promise<void> {
  console.log(`\n[FACES-UC] Señal ${senal} recibida. Cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void cerrar('SIGINT');
});
process.on('SIGTERM', () => {
  void cerrar('SIGTERM');
});
