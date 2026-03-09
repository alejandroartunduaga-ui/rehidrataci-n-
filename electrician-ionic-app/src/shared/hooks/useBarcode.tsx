import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';

// Importar QuaggaJS
import Quagga from 'quagga';

export type BarcodeFormat =
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'codabar'
  | 'ean_13'
  | 'ean_8';

export interface BarcodeState {
  isScanning: boolean;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  lastResult: string | null;
}

export interface BarcodeScanOptions {
  formats?: BarcodeFormat[];
  facingMode?: 'user' | 'environment'; // 'user' = frontal, 'environment' = trasera
  width?: number;
  height?: number;
}

export interface UseBarcodeReturn {
  state: BarcodeState;
  videoRef: React.RefObject<HTMLDivElement>;
  checkPermissions: () => Promise<boolean>;
  startScanning: (
    options?: BarcodeScanOptions & { onDetected?: (result: string) => void }
  ) => Promise<boolean>;
  stopScanning: () => Promise<void>;
  resetState: () => void;
}

export const useBarcode = (): UseBarcodeReturn => {
  const { t } = useTranslation(TranslationNamespaces.GLOBAL);

  const [state, setState] = useState<BarcodeState>({
    isScanning: false,
    isLoading: false,
    error: null,
    hasPermission: null,
    lastResult: null,
  });

  const videoRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Verificar si getUserMedia está disponible
   */
  const isWebCameraSupported = useCallback((): boolean => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  /**
   * Actualizar estado
   */
  const updateState = useCallback((updates: Partial<BarcodeState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Verificar permisos de cámara
   */
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!isWebCameraSupported()) {
      updateState({
        error: t('barcode_scanner.camera_not_supported'),
        hasPermission: false,
      });
      return false;
    }

    try {
      updateState({ isLoading: true, error: null });

      // Solicitar permisos básicos de cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      // Cerrar el stream inmediatamente, solo verificamos permisos
      stream.getTracks().forEach((track) => track.stop());

      updateState({
        hasPermission: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      let errorMessage = t('barcode_scanner.permission_error');
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = t('barcode_scanner.permission_denied');
        } else if (error.name === 'NotFoundError') {
          errorMessage = t('barcode_scanner.camera_not_found');
        }
      }

      updateState({
        error: errorMessage,
        hasPermission: false,
        isLoading: false,
      });

      return false;
    }
  }, [isWebCameraSupported, updateState, t]);

  /**
   * Inicializar QuaggaJS
   */
  const initializeQuagga = useCallback(
    async (options: BarcodeScanOptions = {}) => {
      const {
        formats = ['code_128', 'code_39', 'ean_13', 'ean_8', 'codabar'],
        facingMode = 'environment',
        width = options.width || 1280,
        height = options.height || 720,
      } = options;

      return new Promise<void>((resolve, reject) => {
        // Esperar a que el contenedor esté disponible
        const waitForVideoContainer = async (maxAttempts = 10) => {
          for (let i = 0; i < maxAttempts; i++) {
            if (videoRef.current) {
              return videoRef.current;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          throw new Error('Video container not found after waiting');
        };

        waitForVideoContainer()
          .then((containerElement) => {
            Quagga.init(
              {
                inputStream: {
                  name: 'Live',
                  type: 'LiveStream',
                  target: containerElement, // QuaggaJS creará el video element dentro de este div
                  constraints: {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: { ideal: facingMode },
                    aspectRatio: { ideal: 16 / 9 },
                  },
                },
                locator: {
                  patchSize: 'medium',
                  halfSample: true,
                },
                numOfWorkers: navigator.hardwareConcurrency || 2,
                frequency: 3, // Procesar cada 3 frames - detección más lenta
                decoder: {
                  readers: formats.map((format) => {
                    switch (format) {
                      case 'code_128':
                        return 'code_128_reader';
                      case 'code_39':
                        return 'code_39_reader';
                      case 'code_93':
                        return 'code_93_reader';
                      case 'codabar':
                        return 'codabar_reader';
                      case 'ean_13':
                        return 'ean_reader';
                      case 'ean_8':
                        return 'ean_8_reader';
                      default:
                        return 'code_128_reader';
                    }
                  }),
                },
                locate: true,
              },
              (err) => {
                if (err) {
                  console.error('❌ Error initializing Quagga:', err);
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          })
          .catch((error) => {
            console.error('❌ Error waiting for video container:', error);
            reject(error);
          });
      });
    },
    []
  );

  /**
   * Configurar listeners de QuaggaJS
   */
  const setupQuaggaListeners = useCallback(
    (onDetected?: (result: string) => void) => {
      // Limpiar listeners anteriores
      Quagga.offDetected();
      Quagga.offProcessed();

      // Listener para códigos detectados
      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        updateState({
          lastResult: code,
        });
        // Callback para el componente padre
        onDetected?.(code);
      });

      // Listener para debugging (opcional)
      Quagga.onProcessed((result) => {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(
              0,
              0,
              parseInt(drawingCanvas.getAttribute('width') || '0'),
              parseInt(drawingCanvas.getAttribute('height') || '0')
            );
            result.boxes
              .filter((box) => box !== result.box)
              .forEach((box) => {
                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
                  color: 'green',
                  lineWidth: 2,
                });
              });
          }

          if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
              color: '#00F',
              lineWidth: 2,
            });
          }

          if (result.codeResult && result.codeResult.code) {
            Quagga.ImageDebug.drawPath(
              result.line,
              { x: 'x', y: 'y' },
              drawingCtx,
              { color: 'red', lineWidth: 3 }
            );
          }
        }
      });
    },
    [updateState]
  );

  /**
   * Iniciar escaneo
   */
  const startScanning = useCallback(
    async (
      options: BarcodeScanOptions & {
        onDetected?: (result: string) => void;
      } = {}
    ): Promise<boolean> => {
      try {
        updateState({ isLoading: true, error: null });

        // Verificar permisos primero
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          return false;
        }

        // Inicializar QuaggaJS
        await initializeQuagga(options);

        // Configurar listeners
        setupQuaggaListeners(options.onDetected);

        // Iniciar el escaneo
        Quagga.start();

        updateState({
          isScanning: true,
          isLoading: false,
        });
        return true;
      } catch (error) {
        console.error('❌ Error starting barcode scanner:', error);

        updateState({
          error: t('barcode_scanner.start_error'),
          isScanning: false,
          isLoading: false,
        });

        return false;
      }
    },
    [checkPermissions, initializeQuagga, setupQuaggaListeners, updateState, t]
  );

  /**
   * Detener escaneo
   */
  const stopScanning = useCallback(async (): Promise<void> => {
    try {
      // Detener QuaggaJS
      Quagga.stop();

      // Limpiar listeners
      Quagga.offDetected();
      Quagga.offProcessed();

      // Detener stream de cámara si existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      updateState({
        isScanning: false,
        lastResult: null,
      });
    } catch (error) {
      console.error('❌ Error stopping barcode scanner:', error);
      updateState({
        error: t('barcode_scanner.stop_error'),
        isScanning: false,
      });
    }
  }, [updateState, t]);

  /**
   * Resetear estado
   */
  const resetState = useCallback(() => {
    setState({
      isScanning: false,
      isLoading: false,
      error: null,
      hasPermission: null,
      lastResult: null,
    });
  }, []);

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      if (state.isScanning) {
        stopScanning();
      }
    };
  }, [state.isScanning, stopScanning]);

  return {
    state,
    videoRef,
    checkPermissions,
    startScanning,
    stopScanning,
    resetState,
  };
};

export default useBarcode;
