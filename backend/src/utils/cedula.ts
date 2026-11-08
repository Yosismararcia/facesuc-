/**
 * Normaliza una cédula venezolana dejando únicamente los dígitos.
 * Ejemplos: "V-12.345.678" -> "12345678", " 12345678 " -> "12345678".
 */
export function normalizarCedula(valor: string): string {
  return String(valor ?? '').replace(/\D/g, '');
}

/**
 * Valida que la cédula normalizada tenga una longitud razonable (5-9 dígitos).
 */
export function esCedulaValida(cedula: string): boolean {
  return /^\d{5,9}$/.test(cedula);
}

/**
 * Presenta la cédula con separador de miles y prefijo venezolano.
 * Ejemplo: "12345678" -> "V-12.345.678"
 */
export function formatearCedula(cedula: string): string {
  const digitos = normalizarCedula(cedula);
  if (!digitos) return '';
  const conPuntos = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `V-${conPuntos}`;
}
