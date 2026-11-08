const UNIDADES = [
  'cero',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
  'veintiuno',
  'veintidós',
  'veintitrés',
  'veinticuatro',
  'veinticinco',
  'veintiséis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
];

const DECENAS: Record<number, string> = {
  30: 'treinta',
  40: 'cuarenta',
  50: 'cincuenta',
  60: 'sesenta',
  70: 'setenta',
  80: 'ochenta',
  90: 'noventa',
};

const CENTENAS = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
];

/** Convierte un entero entre 0 y 999 a texto en español. */
function seccionATexto(numero: number): string {
  if (numero < 30) return UNIDADES[numero];

  if (numero < 100) {
    const decena = Math.floor(numero / 10) * 10;
    const unidad = numero % 10;
    return unidad === 0 ? DECENAS[decena] : `${DECENAS[decena]} y ${UNIDADES[unidad]}`;
  }

  if (numero === 100) return 'cien';

  const centena = Math.floor(numero / 100);
  const resto = numero % 100;
  return resto === 0
    ? CENTENAS[centena]
    : `${CENTENAS[centena]} ${seccionATexto(resto)}`;
}

/** Convierte un entero no negativo (hasta 999.999) a texto. */
function enteroATexto(numero: number): string {
  if (numero < 1000) return seccionATexto(numero);

  const miles = Math.floor(numero / 1000);
  const resto = numero % 1000;
  const milesTexto = miles === 1 ? 'mil' : `${seccionATexto(miles)} mil`;

  return resto === 0 ? milesTexto : `${milesTexto} ${seccionATexto(resto)}`;
}

function capitalizar(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Convierte una nota numérica a su equivalente textual en español.
 * Ejemplos:
 *   18     -> "Dieciocho"
 *   20     -> "Veinte"
 *   18.5   -> "Dieciocho coma cincuenta"
 *   0      -> "Cero"
 */
export function numeroALetras(valor: number): string {
  if (!Number.isFinite(valor) || valor < 0) return '';

  const entero = Math.trunc(valor);
  const centavos = Math.round((valor - entero) * 100);

  let texto = enteroATexto(entero);

  if (centavos > 0) {
    texto += ` coma ${enteroATexto(centavos)}`;
  }

  return capitalizar(texto);
}
