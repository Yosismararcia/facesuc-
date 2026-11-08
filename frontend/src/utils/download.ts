export type FormatoArchivo = 'docx' | 'pdf';

const MIME_POR_FORMATO: Record<FormatoArchivo, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
};

const DESCRIPCION_POR_FORMATO: Record<FormatoArchivo, string> = {
  docx: 'Documento de Microsoft Word',
  pdf: 'Documento PDF',
};

interface SaveFileStream {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

interface SaveFileHandle {
  createWritable(): Promise<SaveFileStream>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: {
    description?: string;
    accept: Record<string, string[]>;
  }[];
}

interface WindowConSelector extends Window {
  showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<SaveFileHandle>;
}

/**
 * Guarda un Blob en el equipo del usuario.
 *
 * Si el navegador soporta File System Access API (Chrome/Edge), muestra el
 * diálogo nativo "Guardar como" para que el usuario elija ubicación y nombre.
 * Si no, usa la descarga tradicional con etiqueta <a download>.
 *
 * Devuelve true si el archivo se guardó y false si el usuario canceló.
 */
export async function guardarArchivo(
  blob: Blob,
  filename: string,
  formato: FormatoArchivo = 'docx',
): Promise<boolean> {
  const ventana = window as WindowConSelector;
  const mime = MIME_POR_FORMATO[formato];

  if (typeof ventana.showSaveFilePicker === 'function') {
    try {
      const handle = await ventana.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: DESCRIPCION_POR_FORMATO[formato],
            accept: { [mime]: [`.${formato}`] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (error) {
      const nombreError =
        typeof error === 'object' && error !== null && 'name' in error
          ? String((error as { name: unknown }).name)
          : '';

      if (nombreError === 'AbortError') {
        return false;
      }

      // Cualquier otro error (permisos, navegador) cae al método tradicional.
      console.warn('No se pudo usar el selector de archivos; usando descarga directa.', error);
    }
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = filename;
  enlace.rel = 'noopener';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);

  return true;
}
