import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Device, DeviceInfo, OperatingSystem } from '@capacitor/device';

export interface IExtendedDeviceInfo extends DeviceInfo {
  // 🌐 Información adicional para web
  userAgent?: string;
  language?: string;
  languages?: readonly string[];
  cookieEnabled?: boolean;
  onLine?: boolean;
  // 📱 Información calculada
  isMobile?: boolean;
  isTablet?: boolean;
  isDesktop?: boolean;
  screenInfo?: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
  };
  // 🔋 Información de batería (cuando esté disponible)
  battery?: {
    level: number;
    charging: boolean;
    chargingTime?: number;
    dischargingTime?: number;
  };
}

export interface IDeviceCapabilities {
  // 📷 Capacidades de media
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasGeolocation: boolean;
  // 💾 Capacidades de almacenamiento
  hasLocalStorage: boolean;
  hasSessionStorage: boolean;
  hasIndexedDB: boolean;
  // 🌐 Capacidades de red
  hasServiceWorker: boolean;
  hasWebRTC: boolean;
  // 📱 Capacidades de dispositivo
  hasTouchScreen: boolean;
  hasVibration: boolean;
  hasNotifications: boolean;
  // 🎨 Capacidades de display
  supportsWebP: boolean;
  supportsAVIF: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
}

interface UseDeviceInfoReturn {
  deviceInfo: IExtendedDeviceInfo | null;
  capabilities: IDeviceCapabilities | null;
  isNative: boolean;
  platform: string;
  isLoading: boolean;
  error: string | null;
  refreshDeviceInfo: () => Promise<void>;
  getBatteryInfo: () => Promise<IExtendedDeviceInfo['battery'] | null>;
}

export const useDeviceInfo = (): UseDeviceInfoReturn => {
  const [deviceInfo, setDeviceInfo] = useState<IExtendedDeviceInfo | null>(
    null
  );
  const [capabilities, setCapabilities] = useState<IDeviceCapabilities | null>(
    null
  );
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<string>('web');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔋 Obtener información de batería
  const getBatteryInfo = useCallback(async (): Promise<
    IExtendedDeviceInfo['battery'] | null
  > => {
    try {
      if (isNative) {
        // 📱 Usar Capacitor Device API para batería
        const batteryInfo = await Device.getBatteryInfo();
        return {
          level: batteryInfo.batteryLevel || 0,
          charging: batteryInfo.isCharging || false,
        };
      } else {
        // 🌐 Usar Web Battery API si está disponible
        if ('getBattery' in navigator) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const battery = await (navigator as any).getBattery();
          return {
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
          };
        }
      }
    } catch (error) {
      console.error('Battery info not available:', error);
    }
    return null;
  }, [isNative]);

  // 🖥️ Obtener información de pantalla
  const getScreenInfo = useCallback(() => {
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
    };
  }, []);

  // 🛠️ Detectar capacidades del dispositivo
  const detectCapabilities = useCallback((): IDeviceCapabilities => {
    return {
      // 📷 Media capabilities
      hasCamera: !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      ),
      hasMicrophone: !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      ),
      hasGeolocation: !!navigator.geolocation,

      // 💾 Storage capabilities
      hasLocalStorage: (() => {
        try {
          return typeof Storage !== 'undefined' && !!localStorage;
        } catch {
          return false;
        }
      })(),
      hasSessionStorage: (() => {
        try {
          return typeof Storage !== 'undefined' && !!sessionStorage;
        } catch {
          return false;
        }
      })(),
      hasIndexedDB: !!window.indexedDB,

      // 🌐 Web capabilities
      hasServiceWorker: 'serviceWorker' in navigator,
      hasWebRTC: !!window.RTCPeerConnection,

      // 📱 Device capabilities
      hasTouchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      hasVibration: !!navigator.vibrate,
      hasNotifications: 'Notification' in window,

      // 🎨 Display capabilities
      supportsWebP: (() => {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      })(),
      supportsAVIF: (() => {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      })(),
      prefersReducedMotion: window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches,
      prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)')
        .matches,
    };
  }, []);

  // 🔍 Detectar tipo de dispositivo basado en screen size y user agent
  const detectDeviceType = useCallback((info: DeviceInfo) => {
    const screenWidth = window.screen.width;
    // const screenHeight = window.screen.height;
    const userAgent = navigator.userAgent.toLowerCase();

    // 📱 Mobile detection
    const isMobile =
      info.platform === 'ios' ||
      info.platform === 'android' ||
      screenWidth <= 768 ||
      /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );

    // 📊 Tablet detection
    const isTablet =
      (screenWidth > 768 && screenWidth <= 1024) ||
      /tablet|ipad/i.test(userAgent);

    // 🖥️ Desktop detection
    const isDesktop = !isMobile && !isTablet;

    return { isMobile, isTablet, isDesktop };
  }, []);

  // 📱 Obtener información del dispositivo nativo
  const getNativeDeviceInfo =
    useCallback(async (): Promise<IExtendedDeviceInfo> => {
      try {
        const info = await Device.getInfo();
        const deviceTypes = detectDeviceType(info);
        const batteryInfo = await getBatteryInfo();

        return {
          ...info,
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          screenInfo: getScreenInfo(),
          battery: batteryInfo || undefined,
          ...deviceTypes,
        };
      } catch (error) {
        throw new Error(`Error getting native device info: ${error}`);
      }
    }, [detectDeviceType, getBatteryInfo, getScreenInfo]);

  // 🌐 Obtener información del dispositivo web
  const getWebDeviceInfo =
    useCallback(async (): Promise<IExtendedDeviceInfo> => {
      const userAgent = navigator.userAgent;
      const batteryInfo = await getBatteryInfo();

      // 🔍 Detectar OS desde user agent
      let operatingSystem = 'unknown';
      if (userAgent.includes('Windows')) operatingSystem = 'windows';
      else if (userAgent.includes('Mac')) operatingSystem = 'mac';
      else if (userAgent.includes('Linux')) operatingSystem = 'linux';
      else if (userAgent.includes('Android')) operatingSystem = 'android';
      else if (
        userAgent.includes('iOS') ||
        userAgent.includes('iPhone') ||
        userAgent.includes('iPad')
      ) {
        operatingSystem = 'ios';
      }

      // 🔍 Detectar información básica
      const mockDeviceInfo: DeviceInfo = {
        model: 'Web Browser',
        platform: 'web',
        operatingSystem: operatingSystem as OperatingSystem,
        osVersion: 'unknown',
        manufacturer: 'unknown',
        isVirtual: false,
        webViewVersion: userAgent,
      };

      const deviceTypes = detectDeviceType(mockDeviceInfo);

      return {
        ...mockDeviceInfo,
        userAgent,
        language: navigator.language,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screenInfo: getScreenInfo(),
        battery: batteryInfo || undefined,
        ...deviceTypes,
      };
    }, [detectDeviceType, getBatteryInfo, getScreenInfo]);

  // 🔄 Función principal para obtener info del dispositivo
  const refreshDeviceInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const isNativeApp = Capacitor.isNativePlatform();
      const currentPlatform = Capacitor.getPlatform();

      setIsNative(isNativeApp);
      setPlatform(currentPlatform);

      let info: IExtendedDeviceInfo;

      if (isNativeApp) {
        info = await getNativeDeviceInfo();
      } else {
        info = await getWebDeviceInfo();
      }

      setDeviceInfo(info);

      // 🛠️ Detectar capacidades
      const caps = detectCapabilities();
      setCapabilities(caps);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error desconocido al obtener información del dispositivo';
      setError(errorMessage);
      console.error('Error getting device info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getNativeDeviceInfo, getWebDeviceInfo, detectCapabilities]);

  // 🚀 Inicializar al montar el componente
  useEffect(() => {
    refreshDeviceInfo();
  }, [refreshDeviceInfo]);

  // 🔄 Escuchar cambios de red
  useEffect(() => {
    const handleOnlineChange = () => {
      if (deviceInfo) {
        setDeviceInfo((prev) =>
          prev ? { ...prev, onLine: navigator.onLine } : null
        );
      }
    };

    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, [deviceInfo]);

  return {
    deviceInfo,
    capabilities,
    isNative,
    platform,
    isLoading,
    error,
    refreshDeviceInfo,
    getBatteryInfo,
  };
};
