/**
 * Formatea un número con coma decimal y sin ceros decimales innecesarios.
 * Ejemplos: 18 -> "18", 18.5 -> "18,5", 18.333 -> "18,33".
 */
export function formatearNota(valor: number): string {
  if (!Number.isFinite(valor)) return '';
  const redondeado = Math.round(valor * 100) / 100;
  return redondeado
    .toFixed(2)
    .replace(/\.?0+$/, '')
    .replace('.', ',');
}

/**
 * Formatea siempre con 2 decimales y coma decimal.
 * Ejemplo: 18.3333 -> "18,33"
 */
export function formatearIndice(valor: number): string {
  const seguro = Number.isFinite(valor) ? valor : 0;
  return seguro.toFixed(2).replace('.', ',');
}

/**
 * Convierte un valor proveniente del CSV en número, aceptando coma decimal.
 */
export function parseNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  const normalizado = texto.replace(/\s/g, '').replace(',', '.');
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}
