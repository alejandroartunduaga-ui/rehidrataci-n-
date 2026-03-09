/**
 * 🗃️ Utilidades para manejo de archivos y conversión a Blob
 * Incluye conversiones, validaciones y optimizaciones
 */

// Tipos de archivo soportados
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
] as const;

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const SUPPORTED_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_DOCUMENT_TYPES,
] as const;

export interface BlobConversionResult {
  blob: Blob;
  originalSize: number;
  newSize: number;
  compressionRatio: number;
  mimeType: string;
  name?: string;
}

export interface BlobValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
  size?: number;
}

/**
 * 📄 Convertir File a Blob
 */
export const fileToBlob = async (file: File): Promise<BlobConversionResult> => {
  try {
    const blob = new Blob([file], { type: file.type });

    return {
      blob,
      originalSize: file.size,
      newSize: blob.size,
      compressionRatio: 0, // No hay compresión en esta conversión
      mimeType: file.type,
      name: file.name,
    };
  } catch (error) {
    throw new Error(
      `Error convirtiendo File a Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * 🔗 Convertir Base64 string a Blob
 */
export const base64ToBlob = async (
  base64String: string,
  mimeType?: string
): Promise<BlobConversionResult> => {
  try {
    // Detectar MIME type si no se proporciona
    let detectedMimeType = mimeType;
    let base64Data = base64String;

    // Si el string incluye el prefijo data:
    if (base64String.startsWith('data:')) {
      const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        detectedMimeType = matches[1];
        base64Data = matches[2];
      } else {
        throw new Error('Formato Base64 inválido');
      }
    }

    // Validar que tenemos MIME type
    if (!detectedMimeType) {
      detectedMimeType = 'application/octet-stream'; // Fallback
    }

    // Convertir Base64 a bytes
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: detectedMimeType });

    return {
      blob,
      originalSize: base64String.length, // Tamaño aproximado del string
      newSize: blob.size,
      compressionRatio:
        ((base64String.length - blob.size) / base64String.length) * 100,
      mimeType: detectedMimeType,
    };
  } catch (error) {
    throw new Error(
      `Error convirtiendo Base64 a Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * 🌐 Convertir URL (HTTP, blob:, data:) a Blob
 */
export const urlToBlob = async (url: string): Promise<BlobConversionResult> => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const contentType =
      response.headers.get('content-type') ||
      blob.type ||
      'application/octet-stream';

    return {
      blob: new Blob([blob], { type: contentType }),
      originalSize:
        parseInt(response.headers.get('content-length') || '0', 10) ||
        blob.size,
      newSize: blob.size,
      compressionRatio: 0,
      mimeType: contentType,
    };
  } catch (error) {
    throw new Error(
      `Error convirtiendo URL a Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * 📝 Convertir texto a Blob
 */
export const textToBlob = (
  text: string,
  mimeType: string = 'text/plain',
  encoding: string = 'utf-8'
): BlobConversionResult => {
  try {
    const blob = new Blob([text], { type: `${mimeType}; charset=${encoding}` });

    return {
      blob,
      originalSize: text.length,
      newSize: blob.size,
      compressionRatio: 0,
      mimeType: `${mimeType}; charset=${encoding}`,
    };
  } catch (error) {
    throw new Error(
      `Error convirtiendo texto a Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * 🎨 Convertir Canvas a Blob
 */
export const canvasToBlob = async (
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/png',
  quality?: number
): Promise<BlobConversionResult> => {
  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('No se pudo convertir canvas a Blob'));
          }
        },
        mimeType,
        quality
      );
    });

    const originalSize = canvas.width * canvas.height * 4; // RGBA aproximado

    return {
      blob,
      originalSize,
      newSize: blob.size,
      compressionRatio: ((originalSize - blob.size) / originalSize) * 100,
      mimeType,
    };
  } catch (error) {
    throw new Error(
      `Error convirtiendo Canvas a Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * ✅ Validar Blob
 */
export const validateBlob = (
  blob: Blob,
  options?: {
    maxSize?: number; // en bytes
    allowedTypes?: readonly string[];
    minSize?: number; // en bytes
  }
): BlobValidationResult => {
  try {
    // Validar que es un Blob válido
    if (!blob || !(blob instanceof Blob)) {
      return {
        isValid: false,
        error: 'No es un Blob válido',
      };
    }

    // Validar tamaño mínimo
    if (options?.minSize && blob.size < options.minSize) {
      return {
        isValid: false,
        error: `Archivo demasiado pequeño. Mínimo: ${options.minSize} bytes`,
        size: blob.size,
      };
    }

    // Validar tamaño máximo
    if (options?.maxSize && blob.size > options.maxSize) {
      return {
        isValid: false,
        error: `Archivo demasiado grande. Máximo: ${options.maxSize} bytes`,
        size: blob.size,
      };
    }

    // Validar tipo MIME
    if (options?.allowedTypes && !options.allowedTypes.includes(blob.type)) {
      return {
        isValid: false,
        error: `Tipo de archivo no permitido: ${blob.type}. Permitidos: ${options.allowedTypes.join(', ')}`,
        mimeType: blob.type,
      };
    }

    return {
      isValid: true,
      mimeType: blob.type,
      size: blob.size,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Error validando Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    };
  }
};

/**
 * 📏 Obtener información del Blob
 */
export const getBlobInfo = (blob: Blob) => {
  return {
    size: blob.size,
    type: blob.type,
    sizeFormatted: formatBytes(blob.size),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isImage: SUPPORTED_IMAGE_TYPES.includes(blob.type as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isDocument: SUPPORTED_DOCUMENT_TYPES.includes(blob.type as any),
    extension: getExtensionFromMimeType(blob.type),
  };
};

/**
 * 🔀 Cambiar tipo MIME del Blob
 */
export const changeBlobType = (
  blob: Blob,
  newMimeType: string
): BlobConversionResult => {
  try {
    const newBlob = new Blob([blob], { type: newMimeType });

    return {
      blob: newBlob,
      originalSize: blob.size,
      newSize: newBlob.size,
      compressionRatio: 0,
      mimeType: newMimeType,
    };
  } catch (error) {
    throw new Error(
      `Error cambiando tipo de Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * ✂️ Dividir Blob en chunks
 */
export const sliceBlob = (blob: Blob, chunkSize: number): Blob[] => {
  try {
    const chunks: Blob[] = [];
    const totalSize = blob.size;

    for (let start = 0; start < totalSize; start += chunkSize) {
      const end = Math.min(start + chunkSize, totalSize);
      const chunk = blob.slice(start, end);
      chunks.push(chunk);
    }

    return chunks;
  } catch (error) {
    throw new Error(
      `Error dividiendo Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * 🔗 Concatenar múltiples Blobs
 */
export const mergeBlobs = (
  blobs: Blob[],
  mimeType?: string
): BlobConversionResult => {
  try {
    if (blobs.length === 0) {
      throw new Error('No se proporcionaron Blobs para concatenar');
    }

    const finalMimeType = mimeType || blobs[0].type;
    const originalSize = blobs.reduce((total, blob) => total + blob.size, 0);
    const mergedBlob = new Blob(blobs, { type: finalMimeType });

    return {
      blob: mergedBlob,
      originalSize,
      newSize: mergedBlob.size,
      compressionRatio: 0,
      mimeType: finalMimeType,
    };
  } catch (error) {
    throw new Error(
      `Error concatenando Blobs: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * 💾 Convertir Blob a ArrayBuffer
 */
export const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
  try {
    return await blob.arrayBuffer();
  } catch (error) {
    throw new Error(
      `Error convirtiendo Blob a ArrayBuffer: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * 📖 Convertir Blob a texto
 */
export const blobToText = async (blob: Blob): Promise<string> => {
  try {
    return await blob.text();
  } catch (error) {
    throw new Error(
      `Error convirtiendo Blob a texto: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * 🔗 Crear URL temporal de Blob (con registro para limpieza)
 */
export const createBlobUrl = (blob: Blob): string => {
  try {
    const url = URL.createObjectURL(blob);

    // Registrar para limpieza automática después de 5 minutos
    setTimeout(
      () => {
        try {
          URL.revokeObjectURL(url);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Ignorar errores de URLs ya revocadas
        }
      },
      5 * 60 * 1000
    ); // 5 minutos

    return url;
  } catch (error) {
    throw new Error(
      `Error creando URL de Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

/**
 * 🗑️ Revocar URL de Blob
 */
export const revokeBlobUrl = (url: string): void => {
  try {
    URL.revokeObjectURL(url);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // Ignorar errores silenciosamente
  }
};

// === UTILIDADES AUXILIARES ===

/**
 * 📊 Formatear bytes a formato legible
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 🎯 Obtener extensión desde MIME type
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
  };

  return extensions[mimeType] || 'bin';
};

/**
 * 🎯 Obtener MIME type desde extensión
 */
export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    txt: 'text/plain',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * 🔄 Conversión universal a Blob
 * Detecta automáticamente el tipo de entrada y convierte a Blob
 */
export const convertToBlob = async (
  input: File | string | HTMLCanvasElement | Blob,
  options?: {
    mimeType?: string;
    quality?: number;
  }
): Promise<BlobConversionResult> => {
  try {
    // Si ya es un Blob, devolverlo
    if (input instanceof Blob) {
      return {
        blob: input,
        originalSize: input.size,
        newSize: input.size,
        compressionRatio: 0,
        mimeType: input.type,
      };
    }

    // Si es un File
    if (input instanceof File) {
      return await fileToBlob(input);
    }

    // Si es un Canvas
    if (input instanceof HTMLCanvasElement) {
      return await canvasToBlob(input, options?.mimeType, options?.quality);
    }

    // Si es un string (Base64 o URL)
    if (typeof input === 'string') {
      // Detectar si es Base64
      if (input.startsWith('data:') || input.match(/^[A-Za-z0-9+/]+=*$/)) {
        return await base64ToBlob(input, options?.mimeType);
      }

      // Detectar si es URL
      if (
        input.startsWith('http') ||
        input.startsWith('blob:') ||
        input.startsWith('file:')
      ) {
        return await urlToBlob(input);
      }

      // Asumir que es texto
      return textToBlob(input, options?.mimeType);
    }

    throw new Error('Tipo de entrada no soportado');
  } catch (error) {
    throw new Error(
      `Error en conversión universal a Blob: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};
