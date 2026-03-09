import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

export type PlatformType = 'ios' | 'android' | 'web' | 'electron';

export interface IPlatformInfo {
  platform: PlatformType;
  isNative: boolean;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isElectron: boolean;
  isMobileWeb: boolean;
  isTabletWeb: boolean;
  isDesktopWeb: boolean;
  // 📱 Información específica de plataforma
  platformVersion?: string;
  webViewVersion?: string;
  userAgent: string;
  // 🎨 Configuraciones de UI por plataforma
  statusBarHeight: number;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  // ⌨️ Keyboard info
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

export interface IPlatformCapabilities {
  // 🎨 Status Bar
  canControlStatusBar: boolean;
  supportsStatusBarOverlay: boolean;
  // ⌨️ Keyboard
  hasPhysicalKeyboard: boolean;
  supportsKeyboardResize: boolean;
  // 🔔 Notifications
  supportsPushNotifications: boolean;
  supportsLocalNotifications: boolean;
  // 🔄 Navigation
  supportsBackButton: boolean;
  supportsSwipeGestures: boolean;
  // 📱 Hardware
  supportsHapticFeedback: boolean;
  supportsBiometrics: boolean;
  // 🌐 Web específico
  supportsPWA: boolean;
  supportsInstallPrompt: boolean;
}

export interface IPlatformActions {
  // 🎨 Status Bar
  setStatusBarStyle: (style: Style) => Promise<void>;
  setStatusBarBackgroundColor: (color: string) => Promise<void>;
  hideStatusBar: () => Promise<void>;
  showStatusBar: () => Promise<void>;
  // ⌨️ Keyboard
  hideKeyboard: () => Promise<void>;
  showKeyboard: () => Promise<void>;
  // 🔄 Navigation
  minimizeApp: () => Promise<void>;
  exitApp: () => Promise<void>;
  // 📳 Haptics
  vibrate: (duration?: number) => Promise<void>;
  impactFeedback: (style?: 'light' | 'medium' | 'heavy') => Promise<void>;
}

interface UsePlatformReturn extends IPlatformInfo {
  capabilities: IPlatformCapabilities;
  actions: IPlatformActions;
  isLoading: boolean;
  error: string | null;
  refreshPlatformInfo: () => Promise<void>;
}

export const usePlatform = (): UsePlatformReturn => {
  const [platformInfo, setPlatformInfo] = useState<IPlatformInfo>({
    platform: 'web',
    isNative: false,
    isWeb: true,
    isIOS: false,
    isAndroid: false,
    isElectron: false,
    isMobileWeb: false,
    isTabletWeb: false,
    isDesktopWeb: true,
    userAgent: navigator.userAgent,
    statusBarHeight: 0,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    keyboardHeight: 0,
    isKeyboardVisible: false,
  });

  const [capabilities, setCapabilities] = useState<IPlatformCapabilities>({
    canControlStatusBar: false,
    supportsStatusBarOverlay: false,
    hasPhysicalKeyboard: false,
    supportsKeyboardResize: false,
    supportsPushNotifications: false,
    supportsLocalNotifications: false,
    supportsBackButton: false,
    supportsSwipeGestures: false,
    supportsHapticFeedback: false,
    supportsBiometrics: false,
    supportsPWA: false,
    supportsInstallPrompt: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔍 Detectar plataforma específica
  const detectPlatform = useCallback((): PlatformType => {
    // 🔌 Capacitor platform
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      return platform as PlatformType;
    }

    // 🖥️ Electron detection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return 'electron';
    }

    // 🌐 Web platform
    return 'web';
  }, []);

  // 📱 Detectar tipo de dispositivo web
  const detectWebDeviceType = useCallback(() => {
    const screenWidth = window.screen.width;
    const userAgent = navigator.userAgent.toLowerCase();

    const isMobileWeb =
      screenWidth <= 768 ||
      /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );

    const isTabletWeb =
      !isMobileWeb &&
      ((screenWidth > 768 && screenWidth <= 1024) ||
        /tablet|ipad/i.test(userAgent));

    const isDesktopWeb = !isMobileWeb && !isTabletWeb;

    return { isMobileWeb, isTabletWeb, isDesktopWeb };
  }, []);

  // 📏 Obtener safe area insets
  const getSafeAreaInsets = useCallback(() => {
    const safeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

    // 🍎 iOS safe area
    if (platformInfo.isIOS) {
      const style = getComputedStyle(document.documentElement);
      safeAreaInsets.top =
        parseInt(style.getPropertyValue('--ion-safe-area-top')) || 0;
      safeAreaInsets.bottom =
        parseInt(style.getPropertyValue('--ion-safe-area-bottom')) || 0;
      safeAreaInsets.left =
        parseInt(style.getPropertyValue('--ion-safe-area-left')) || 0;
      safeAreaInsets.right =
        parseInt(style.getPropertyValue('--ion-safe-area-right')) || 0;
    }

    return safeAreaInsets;
  }, [platformInfo.isIOS]);

  // 🛠️ Detectar capacidades por plataforma
  const detectCapabilities = useCallback(
    (platform: PlatformType): IPlatformCapabilities => {
      return {
        // 🎨 Status Bar
        canControlStatusBar: platform === 'ios' || platform === 'android',
        supportsStatusBarOverlay: platform === 'ios',

        // ⌨️ Keyboard
        hasPhysicalKeyboard: platform === 'web' || platform === 'electron',
        supportsKeyboardResize: platform === 'ios' || platform === 'android',

        // 🔔 Notifications
        supportsPushNotifications: platform === 'ios' || platform === 'android',
        supportsLocalNotifications:
          platform === 'ios' ||
          platform === 'android' ||
          (platform === 'web' && 'Notification' in window),

        // 🔄 Navigation
        supportsBackButton: platform === 'android',
        supportsSwipeGestures: platform === 'ios' || platform === 'android',

        // 📱 Hardware
        supportsHapticFeedback: platform === 'ios' || platform === 'android',
        supportsBiometrics: platform === 'ios' || platform === 'android',

        // 🌐 Web específico
        supportsPWA: platform === 'web' && 'serviceWorker' in navigator,
        supportsInstallPrompt:
          platform === 'web' && 'BeforeInstallPromptEvent' in window,
      };
    },
    []
  );

  // 🎨 Acciones del Status Bar
  const statusBarActions = {
    setStatusBarStyle: async (style: Style) => {
      if (capabilities.canControlStatusBar) {
        try {
          await StatusBar.setStyle({ style });
        } catch (error) {
          console.error('Error setting status bar style:', error);
        }
      }
    },

    setStatusBarBackgroundColor: async (color: string) => {
      if (capabilities.canControlStatusBar) {
        try {
          await StatusBar.setBackgroundColor({ color });
        } catch (error) {
          console.error('Error setting status bar color:', error);
        }
      }
    },

    hideStatusBar: async () => {
      if (capabilities.canControlStatusBar) {
        try {
          await StatusBar.hide();
        } catch (error) {
          console.error('Error hiding status bar:', error);
        }
      }
    },

    showStatusBar: async () => {
      if (capabilities.canControlStatusBar) {
        try {
          await StatusBar.show();
        } catch (error) {
          console.error('Error showing status bar:', error);
        }
      }
    },
  };

  // ⌨️ Acciones del Keyboard
  const keyboardActions = {
    hideKeyboard: async () => {
      if (capabilities.supportsKeyboardResize) {
        try {
          await Keyboard.hide();
        } catch (error) {
          console.error('Error hiding keyboard:', error);
        }
      }
    },

    showKeyboard: async () => {
      if (capabilities.supportsKeyboardResize) {
        try {
          await Keyboard.show();
        } catch (error) {
          console.error('Error showing keyboard:', error);
        }
      }
    },
  };

  // 🔄 Acciones de navegación
  const navigationActions = {
    minimizeApp: async () => {
      if (platformInfo.isAndroid) {
        try {
          await App.minimizeApp();
        } catch (error) {
          console.error('Error minimizing app:', error);
        }
      }
    },

    exitApp: async () => {
      if (platformInfo.isNative) {
        try {
          await App.exitApp();
        } catch (error) {
          console.error('Error exiting app:', error);
        }
      }
    },
  };

  // 📳 Acciones de haptics
  const hapticActions = {
    vibrate: async (duration: number = 200) => {
      if (capabilities.supportsHapticFeedback) {
        try {
          if (platformInfo.isNative) {
            const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
            await Haptics.impact({ style: ImpactStyle.Medium });
          } else if (navigator.vibrate) {
            navigator.vibrate(duration);
          }
        } catch (error) {
          console.error('Error with haptic feedback:', error);
        }
      }
    },

    impactFeedback: async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (capabilities.supportsHapticFeedback && platformInfo.isNative) {
        try {
          const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
          const hapticStyle = {
            light: ImpactStyle.Light,
            medium: ImpactStyle.Medium,
            heavy: ImpactStyle.Heavy,
          }[style];
          await Haptics.impact({ style: hapticStyle });
        } catch (error) {
          console.error('Error with impact feedback:', error);
        }
      }
    },
  };

  // 🔄 Función principal para obtener info de plataforma
  const refreshPlatformInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const platform = detectPlatform();
      const isNative = Capacitor.isNativePlatform();
      const webDeviceType = detectWebDeviceType();

      const newPlatformInfo: IPlatformInfo = {
        platform,
        isNative,
        isWeb: platform === 'web',
        isIOS: platform === 'ios',
        isAndroid: platform === 'android',
        isElectron: platform === 'electron',
        ...webDeviceType,
        userAgent: navigator.userAgent,
        platformVersion: isNative ? await Capacitor.getPlatform() : 'web',
        webViewVersion: isNative ? navigator.userAgent : undefined,
        statusBarHeight: 0, // Se actualizará después
        safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }, // Se actualizará después
        keyboardHeight: 0,
        isKeyboardVisible: false,
      };

      setPlatformInfo(newPlatformInfo);

      // 🛠️ Detectar capacidades basadas en la plataforma
      const platformCapabilities = detectCapabilities(platform);
      setCapabilities(platformCapabilities);

      // 📏 Obtener safe area insets (después de actualizar platformInfo)
      setTimeout(() => {
        const safeAreaInsets = getSafeAreaInsets();
        setPlatformInfo((prev) => ({ ...prev, safeAreaInsets }));
      }, 100);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error detectando plataforma';
      setError(errorMessage);
      console.error('Error getting platform info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    detectPlatform,
    detectWebDeviceType,
    detectCapabilities,
    getSafeAreaInsets,
  ]);

  // ⌨️ Configurar listeners del keyboard
  useEffect(() => {
    if (capabilities.supportsKeyboardResize) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let keyboardWillShowListener: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let keyboardWillHideListener: any;

      const setupKeyboardListeners = async () => {
        try {
          keyboardWillShowListener = await Keyboard.addListener(
            'keyboardWillShow',
            (info) => {
              setPlatformInfo((prev) => ({
                ...prev,
                keyboardHeight: info.keyboardHeight,
                isKeyboardVisible: true,
              }));
            }
          );

          keyboardWillHideListener = await Keyboard.addListener(
            'keyboardWillHide',
            () => {
              setPlatformInfo((prev) => ({
                ...prev,
                keyboardHeight: 0,
                isKeyboardVisible: false,
              }));
            }
          );
        } catch (error) {
          console.error('Error setting up keyboard listeners:', error);
        }
      };

      setupKeyboardListeners();

      return () => {
        if (keyboardWillShowListener) {
          keyboardWillShowListener.remove();
        }
        if (keyboardWillHideListener) {
          keyboardWillHideListener.remove();
        }
      };
    }
  }, [capabilities.supportsKeyboardResize]);

  // 🚀 Inicializar al montar
  useEffect(() => {
    refreshPlatformInfo();
  }, [refreshPlatformInfo]);

  const actions: IPlatformActions = {
    ...statusBarActions,
    ...keyboardActions,
    ...navigationActions,
    ...hapticActions,
  };

  return {
    ...platformInfo,
    capabilities,
    actions,
    isLoading,
    error,
    refreshPlatformInfo,
  };
};
