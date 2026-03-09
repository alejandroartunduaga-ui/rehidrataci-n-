import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.biaenergy.tec', // 🏷️ Cambia esto por tu ID de app
  appName: 'App ops',
  webDir: 'dist',

  // 🌐 Configuración del servidor para desarrollo
  server: {
    url:
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:8100'
        : undefined,
    cleartext: true, // 🔓 Permite HTTP en desarrollo
    allowNavigation: [
      'localhost:*',
      '*.bia.com', // 🔗 Cambia por tu dominio
      'https://*.electricians-api.com', // 🔗 Tu API domain
    ],
  },

  // 📱 Configuración de plugins
  plugins: {
    // 🔋 Status Bar
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#3880ff',
      overlaysWebView: false,
    },

    // 🎨 Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#3880ff',
    },

    // ⌨️ Keyboard
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Default,
      resizeOnFullScreen: true,
    },

    // 📱 App
    App: {
      launchUrl: 'app://localhost',
    },

    // 🛠️ Device
    Device: {
      // Configuración básica del dispositivo
    },

    // 🔐 HTTP (para APIs)
    CapacitorHttp: {
      enabled: true, // ✅ Habilita HTTP nativo
    },

    // 💾 Preferences (Storage)
    Preferences: {
      // Configuración de almacenamiento local
    },

    // 🔔 Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // 📱 Local Notifications
    LocalNotifications: {
      smallIcon: 'icon_foreground', // 🎯 Usando icon-foreground.png
      iconColor: '#472BEF', // Color del logo BIA
      sound: 'beep.wav',
    },
  },

  // 🍎 Configuración específica para iOS
  ios: {
    scheme: 'App ops',
    path: 'ios',
    // 🔧 Configuraciones adicionales de iOS
    backgroundColor: '#ffffff',
    scrollEnabled: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },

  // 🤖 Configuración específica para Android
  android: {
    path: 'android',
    // 🔧 Configuraciones adicionales de Android
    backgroundColor: '#ffffff',
    allowMixedContent: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },
};

export default config;
