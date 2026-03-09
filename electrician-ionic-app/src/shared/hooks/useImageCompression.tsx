import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import {
  IImageCompressionOptions,
  IImageCompressionResult,
  IImageCompressionError,
  ICompressionProgress,
} from './interfaces/useImageCompression.interface';

// Configuraciones por defecto (movidas fuera del hook)
const DEFAULT_OPTIONS: IImageCompressionOptions = {
  maxSizeMB: 0.5, // 500KB por defecto
  maxWidthOrHeight: 1280, // HD resolution
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.8,
  alwaysKeepResolution: false,
};

const ACCEPTED_IMAGE_TYPES: string[] = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE_MB: number = 10; // 10MB límite máximo

interface UseImageCompressionReturn {
  compressImage: (
    file: File,
    options?: IImageCompressionOptions
  ) => Promise<IImageCompressionResult>;
  compressMultipleImages: (
    files: File[],
    options?: IImageCompressionOptions
  ) => Promise<IImageCompressionResult[]>;
  compressImageToBase64: (
    file: File,
    options?: IImageCompressionOptions
  ) => Promise<{ dataUrl: string; result: IImageCompressionResult }>;
  isCompressing: boolean;
  progress: ICompressionProgress | null;
  error: IImageCompressionError | null;
  resetError: () => void;
  getPresetOptions: (
    preset: 'low' | 'medium' | 'high' | 'ultra'
  ) => IImageCompressionOptions;
}

export const useImageCompression = (): UseImageCompressionReturn => {
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ICompressionProgress | null>(null);
  const [error, setError] = useState<IImageCompressionError | null>(null);

  // Reset error function
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Validación de archivos
  const validateFile = useCallback(
    (file: File): { isValid: boolean; error?: string } => {
      if (!file) {
        return { isValid: false, error: 'No se proporcionó ningún archivo' };
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return {
          isValid: false,
          error: `Tipo de archivo no soportado: ${file.type}. Tipos aceptados: ${ACCEPTED_IMAGE_TYPES.join(', ')}`,
        };
      }

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return {
          isValid: false,
          error: `El archivo es demasiado grande: ${fileSizeMB.toFixed(2)}MB. Máximo permitido: ${MAX_FILE_SIZE_MB}MB`,
        };
      }

      return { isValid: true };
    },
    []
  );

  // Comprimir una sola imagen
  const compressImage = useCallback(
    async (
      file: File,
      options?: IImageCompressionOptions
    ): Promise<IImageCompressionResult> => {
      const startTime = performance.now();
      setIsCompressing(true);
      setError(null);
      setProgress(null);

      try {
        // Validar archivo
        const validation = validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Combinar opciones
        const compressionOptions = {
          ...DEFAULT_OPTIONS,
          ...options,
        };

        // Comprimir imagen
        const compressedFile = await imageCompression(file, compressionOptions);

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        // Calcular métricas
        const compressionRatio =
          ((file.size - compressedFile.size) / file.size) * 100;

        const result: IImageCompressionResult = {
          compressedFile,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          compressionRatio: Math.round(compressionRatio * 100) / 100,
          processingTime: Math.round(processingTime),
        };

        return result;
      } catch (err) {
        const compressionError: IImageCompressionError = {
          message: `Error al comprimir imagen: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          originalError: err,
          fileName: file.name,
          originalSize: file.size,
        };

        setError(compressionError);
        throw compressionError;
      } finally {
        setIsCompressing(false);
      }
    },
    [validateFile]
  );

  // Comprimir múltiples imágenes
  const compressMultipleImages = useCallback(
    async (
      files: File[],
      options?: IImageCompressionOptions
    ): Promise<IImageCompressionResult[]> => {
      if (!files || files.length === 0) {
        throw new Error('No se proporcionaron archivos para comprimir');
      }

      setIsCompressing(true);
      setError(null);
      setProgress({ current: 0, total: files.length });

      const results: IImageCompressionResult[] = [];
      const errors: { file: File; error: IImageCompressionError }[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          try {
            // Actualizar progreso
            setProgress({ current: i, total: files.length });

            // Comprimir imagen individual
            const result = await compressImage(file, options);
            results.push(result);
          } catch (error) {
            const compressionError = error as IImageCompressionError;
            errors.push({ file, error: compressionError });
          }

          // Actualizar progreso final
          setProgress({ current: i + 1, total: files.length });

          // Pequeña pausa entre archivos para no bloquear la UI
          if (i < files.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }

        // Si todos fallaron, throw error
        if (results.length === 0) {
          throw new Error(
            `Falló la compresión de todos los archivos. Errores: ${errors.map((e) => e.error.message).join(', ')}`
          );
        }

        return results;
      } catch (err) {
        const compressionError = err as IImageCompressionError;
        setError(compressionError);
        throw compressionError;
      } finally {
        setIsCompressing(false);
        setProgress(null);
      }
    },
    [compressImage]
  );

  // Comprimir imagen a base64
  const compressImageToBase64 = useCallback(
    async (
      file: File,
      options?: IImageCompressionOptions
    ): Promise<{ dataUrl: string; result: IImageCompressionResult }> => {
      setIsCompressing(true);
      setError(null);
      setProgress(null);

      try {
        const result = await compressImage(file, options);

        return new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            resolve({
              dataUrl: reader.result as string,
              result,
            });
          };

          reader.onerror = () => {
            reject(new Error('Error al convertir archivo comprimido a base64'));
          };

          reader.readAsDataURL(result.compressedFile);
        });
      } catch (err) {
        const compressionError = err as IImageCompressionError;
        setError(compressionError);
        throw compressionError;
      } finally {
        setIsCompressing(false);
      }
    },
    [compressImage]
  );

  // Configuraciones predefinidas
  const getPresetOptions = useCallback(
    (preset: 'low' | 'medium' | 'high' | 'ultra'): IImageCompressionOptions => {
      const presets = {
        low: {
          maxSizeMB: 2,
          maxWidthOrHeight: 2048,
          initialQuality: 0.9,
        },
        medium: {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          initialQuality: 0.8,
        },
        high: {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1280,
          initialQuality: 0.7,
        },
        ultra: {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 800,
          initialQuality: 0.6,
        },
      };

      return {
        ...DEFAULT_OPTIONS,
        ...presets[preset],
      };
    },
    []
  );

  return {
    compressImage,
    compressMultipleImages,
    compressImageToBase64,
    isCompressing,
    progress,
    error,
    resetError,
    getPresetOptions,
  };
};
