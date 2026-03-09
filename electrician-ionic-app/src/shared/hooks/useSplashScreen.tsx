import { useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

export interface ISplashConfig {
  // ⏱️ Configuración de tiempo
  duration?: number; // Duración en ms (por defecto 2000)
  minDuration?: number; // Duración mínima en ms (por defecto 1000)
  autoHide?: boolean; // Auto ocultar después de duration (por defecto true)

  // 🎨 Configuración visual (solo para web)
  backgroundColor?: string;
  logo?: string; // URL o path del logo
  logoSize?: number; // Tamaño del logo en px
  showSpinner?: boolean; // Mostrar spinner de carga
  spinnerColor?: string;

  // 📱 Configuración nativa
  androidScaleType?:
    | 'CENTER'
    | 'CENTER_CROP'
    | 'CENTER_INSIDE'
    | 'FIT_CENTER'
    | 'FIT_END'
    | 'FIT_START'
    | 'FIT_XY'
    | 'MATRIX';
  androidSplashResourceName?: string;

  // 🎭 Animaciones
  fadeIn?: boolean; // Animación de entrada
  fadeOut?: boolean; // Animación de salida
  animationDuration?: number; // Duración de animaciones en ms

  // 🔄 Estados
  showProgress?: boolean; // Mostrar barra de progreso
  progressColor?: string;

  // 📝 Texto
  loadingText?: string;
  textColor?: string;
  fontSize?: number;
}

export interface ISplashState {
  isVisible: boolean;
  isAnimating: boolean;
  progress: number; // 0-100
  currentText: string;
  error: string | null;
}

interface UseSplashScreenReturn {
  // 📊 Estado
  state: ISplashState;

  // 🎮 Acciones
  show: (config?: Partial<ISplashConfig>) => Promise<void>;
  hide: (immediate?: boolean) => Promise<void>;
  setProgress: (progress: number) => void;
  updateText: (text: string) => void;

  // 📱 Específico de plataforma
  isNative: boolean;

  // ⚙️ Configuración
  updateConfig: (config: Partial<ISplashConfig>) => void;
  resetConfig: () => void;
}

const DEFAULT_CONFIG: ISplashConfig = {
  duration: 2000,
  minDuration: 1000,
  autoHide: true,
  backgroundColor: '#ffffff',
  logoSize: 120,
  showSpinner: true,
  spinnerColor: '#3880ff',
  androidScaleType: 'CENTER_CROP',
  androidSplashResourceName: 'splash',
  fadeIn: true,
  fadeOut: true,
  animationDuration: 300,
  showProgress: false,
  progressColor: '#3880ff',
  loadingText: 'Cargando...',
  textColor: '#666666',
  fontSize: 16,
};

export const useSplashScreen = (
  initialConfig?: Partial<ISplashConfig>
): UseSplashScreenReturn => {
  const [config, setConfig] = useState<ISplashConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const [state, setState] = useState<ISplashState>({
    isVisible: false,
    isAnimating: false,
    progress: 0,
    currentText: config.loadingText || DEFAULT_CONFIG.loadingText!,
    error: null,
  });

  const isNative = Capacitor.isNativePlatform();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const splashElementRef = useRef<HTMLElement | null>(null);

  // 🎨 Crear elemento de splash para web
  const createWebSplashElement = useCallback(() => {
    if (isNative || splashElementRef.current) return;

    const splashElement = document.createElement('div');
    splashElement.id = 'web-splash-screen';
    splashElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: ${config.backgroundColor};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: opacity ${config.animationDuration}ms ease-in-out;
      opacity: ${config.fadeIn ? '0' : '1'};
    `;

    // 🖼️ Logo
    if (config.logo) {
      const logoElement = document.createElement('img');
      logoElement.src = config.logo;
      logoElement.style.cssText = `
        width: ${config.logoSize}px;
        height: ${config.logoSize}px;
        margin-bottom: 20px;
        object-fit: contain;
      `;
      logoElement.onerror = () => {
        console.warn('Could not load splash logo:', config.logo);
      };
      splashElement.appendChild(logoElement);
    }

    // 🔄 Spinner
    if (config.showSpinner) {
      const spinnerElement = document.createElement('div');
      spinnerElement.style.cssText = `
        width: 32px;
        height: 32px;
        border: 3px solid rgba(0,0,0,0.1);
        border-top: 3px solid ${config.spinnerColor};
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      `;

      // 🎭 Agregar keyframes para la animación
      if (!document.getElementById('splash-spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'splash-spinner-styles';
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      splashElement.appendChild(spinnerElement);
    }

    // 📊 Barra de progreso
    if (config.showProgress) {
      const progressContainer = document.createElement('div');
      progressContainer.style.cssText = `
        width: 200px;
        height: 4px;
        background-color: rgba(0,0,0,0.1);
        border-radius: 2px;
        margin-bottom: 16px;
        overflow: hidden;
      `;

      const progressBar = document.createElement('div');
      progressBar.id = 'splash-progress-bar';
      progressBar.style.cssText = `
        width: ${state.progress}%;
        height: 100%;
        background-color: ${config.progressColor};
        border-radius: 2px;
        transition: width 0.3s ease;
      `;

      progressContainer.appendChild(progressBar);
      splashElement.appendChild(progressContainer);
    }

    // 📝 Texto de carga
    const textElement = document.createElement('div');
    textElement.id = 'splash-loading-text';
    textElement.textContent = state.currentText;
    textElement.style.cssText = `
      color: ${config.textColor};
      font-size: ${config.fontSize}px;
      font-weight: 400;
      text-align: center;
      margin-top: 8px;
    `;
    splashElement.appendChild(textElement);

    document.body.appendChild(splashElement);
    splashElementRef.current = splashElement;

    // 🎭 Animación de entrada
    if (config.fadeIn) {
      requestAnimationFrame(() => {
        splashElement.style.opacity = '1';
      });
    }
  }, [config, state.progress, state.currentText, isNative]);

  // 🗑️ Remover elemento de splash para web
  const removeWebSplashElement = useCallback(async () => {
    if (isNative || !splashElementRef.current) return;

    const splashElement = splashElementRef.current;

    if (config.fadeOut) {
      setState((prev) => ({ ...prev, isAnimating: true }));
      splashElement.style.opacity = '0';

      await new Promise((resolve) =>
        setTimeout(resolve, config.animationDuration)
      );
    }

    splashElement.remove();
    splashElementRef.current = null;

    // 🧹 Limpiar estilos
    const styles = document.getElementById('splash-spinner-styles');
    if (styles) styles.remove();

    setState((prev) => ({ ...prev, isAnimating: false }));
  }, [config.fadeOut, config.animationDuration, isNative]);

  // 📱 Mostrar splash screen nativo
  const showNativeSplash = useCallback(async () => {
    try {
      await SplashScreen.show({
        showDuration: config.duration,
        autoHide: config.autoHide,
      });
    } catch (error) {
      console.error('Error showing native splash:', error);
      setState((prev) => ({
        ...prev,
        error: 'Error al mostrar splash nativo',
      }));
    }
  }, [config.duration, config.autoHide]);

  // 📱 Ocultar splash screen nativo
  const hideNativeSplash = useCallback(async () => {
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.error('Error hiding native splash:', error);
      setState((prev) => ({
        ...prev,
        error: 'Error al ocultar splash nativo',
      }));
    }
  }, []);

  // 🎮 Mostrar splash screen
  const show = useCallback(
    async (newConfig?: Partial<ISplashConfig>) => {
      if (newConfig) {
        setConfig((prev) => ({ ...prev, ...newConfig }));
      }

      setState((prev) => ({
        ...prev,
        isVisible: true,
        error: null,
        progress: 0,
      }));

      startTimeRef.current = Date.now();

      if (isNative) {
        await showNativeSplash();
      } else {
        createWebSplashElement();
      }

      // ⏰ Auto hide después de duration
      if (config.autoHide && config.duration) {
        timeoutRef.current = setTimeout(async () => {
          await hide();
        }, config.duration);
      }
    },
    [
      config.autoHide,
      config.duration,
      isNative,
      showNativeSplash,
      createWebSplashElement,
    ]
  );

  // 🙈 Ocultar splash screen
  const hide = useCallback(
    async (immediate: boolean = false) => {
      if (!state.isVisible) return;

      // ⏱️ Respetar duración mínima
      if (!immediate && config.minDuration) {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed < config.minDuration) {
          const remainingTime = config.minDuration - elapsed;
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }
      }

      // 🧹 Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setState((prev) => ({ ...prev, isVisible: false }));

      if (isNative) {
        await hideNativeSplash();
      } else {
        await removeWebSplashElement();
      }
    },
    [
      state.isVisible,
      config.minDuration,
      isNative,
      hideNativeSplash,
      removeWebSplashElement,
    ]
  );

  // 📊 Actualizar progreso
  const setProgress = useCallback(
    (progress: number) => {
      const clampedProgress = Math.max(0, Math.min(100, progress));
      setState((prev) => ({ ...prev, progress: clampedProgress }));

      // 🌐 Actualizar barra de progreso en web
      if (!isNative && splashElementRef.current) {
        const progressBar = splashElementRef.current.querySelector(
          '#splash-progress-bar'
        ) as HTMLElement;
        if (progressBar) {
          progressBar.style.width = `${clampedProgress}%`;
        }
      }
    },
    [isNative]
  );

  // 📝 Actualizar texto
  const updateText = useCallback(
    (text: string) => {
      setState((prev) => ({ ...prev, currentText: text }));

      // 🌐 Actualizar texto en web
      if (!isNative && splashElementRef.current) {
        const textElement = splashElementRef.current.querySelector(
          '#splash-loading-text'
        ) as HTMLElement;
        if (textElement) {
          textElement.textContent = text;
        }
      }
    },
    [isNative]
  );

  // ⚙️ Actualizar configuración
  const updateConfig = useCallback((newConfig: Partial<ISplashConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // 🔄 Resetear configuración
  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG, ...initialConfig });
  }, [initialConfig]);

  // 🧹 Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (!isNative && splashElementRef.current) {
        splashElementRef.current.remove();
      }
    };
  }, [isNative]);

  return {
    state,
    show,
    hide,
    setProgress,
    updateText,
    isNative,
    updateConfig,
    resetConfig,
  };
};
