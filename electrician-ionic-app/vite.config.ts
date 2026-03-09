import fs from 'fs';
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';
/// <reference types="vitest" />

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables del entorno según el modo
  const env = loadEnv(mode, process.cwd());
  const isMobile = process.env.CAPACITOR_PLATFORM !== undefined;

  return {
    // 🚀 Configuración básica de build
    /* build: {
      target: 'esnext',
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ionic: ['@ionic/react', '@ionic/react-router'],
            router: ['react-router', 'react-router-dom'],
            utils: [
              '@tanstack/react-query',
              'react-i18next',
              'mixpanel-browser',
            ],
          },
        },
      },
    }, */
    plugins: [
      react(),
      // 🔧 Activando ambos plugins para reproducir el error
      legacy({
        targets: ['defaults', 'not IE 11'],
      }),
      // 🔧 VitePWA configurado para NO conflictar con Firebase SW
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false, // 🔔 NO registrar automáticamente - Firebase SW se encarga
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: 'App ops - Gestión de Visitas',
          short_name: 'App ops',
          description:
            'Aplicación para gestión de visitas técnicas de electricistas',
          theme_color: '#3880ff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/?source=pwa',
          lang: 'es-ES',
          categories: ['productivity', 'utilities'],
          icons: [
            {
              src: '/icons/icon-192.webp',
              sizes: '192x192',
              type: 'image/webp',
              purpose: 'any maskable',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/webp',
              purpose: 'any maskable',
            },
            {
              src: '/icons/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 15000000, // 15MB para PWA
          cleanupOutdatedCaches: true,
          skipWaiting: true, // 🔄 Actualizar inmediatamente
          clientsClaim: true, // 🔄 Tomar control inmediatamente
          navigateFallback: null, // 🔄 No usar fallback para forzar red
          mode: env.NODE_ENV === 'development' ? 'development' : 'production', // 🔄 Forzar actualizaciones frecuentes
          // 🚫 Excluir rutas de desktop del fallback
          navigateFallbackDenylist: [/^\/admin/, /^\/desktop/],
          // 🔔 IMPORTANTE: No cachear firebase-messaging-sw.js
          dontCacheBustURLsMatching: /firebase-messaging-sw\.js/,
          runtimeCaching: [
            // 🚫 DESKTOP ROUTES - NUNCA CACHEAR
            {
              urlPattern: ({ url }) =>
                url.pathname.startsWith('/admin') ||
                url.pathname.startsWith('/desktop') ||
                url.pathname.includes('work-orders'),
              handler: 'NetworkOnly', // 🌐 Solo red, nunca cache
              options: {
                cacheName: 'desktop-no-cache',
              },
            },
            // 🔄 PÁGINA PRINCIPAL - HÍBRIDA PARA OFFLINE
            {
              urlPattern: ({ url }) =>
                url.pathname === '/' || url.pathname === '/index.html',
              handler: 'NetworkFirst', // 🌐 Red primero, cache como fallback
              options: {
                cacheName: 'main-page',
                networkTimeoutSeconds: 3, // ⚡ Timeout muy corto
                expiration: {
                  maxEntries: 1,
                  maxAgeSeconds: 60 * 10, // 🔄 Solo 10 minutos de cache
                },
              },
            },
            // 🔄 Estrategia para páginas HTML - SIEMPRE ACTUALIZAR
            {
              urlPattern: /^https?.*\.html$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-cache',
                networkTimeoutSeconds: 3, // 🔄 Timeout corto
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 10, // 🔄 Solo 5 minutos
                },
              },
            },
            // 🎨 Estrategia para CSS y JS - SIEMPRE ACTUALIZAR
            {
              urlPattern: /\.(?:css|js)$/,
              handler: 'NetworkFirst', // 🔄 Red primero para actualizaciones
              options: {
                cacheName: 'static-resources',
                networkTimeoutSeconds: 3, // 🔄 Timeout corto
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60, // 🔄 Solo 1 hora
                },
              },
            },
            // 🖼️ Estrategia para imágenes
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
                },
              },
            },
            // 🔤 Estrategia para fuentes
            {
              urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
                },
              },
            },
            // 🎯 Estrategia ESPECÍFICA para assets locales (/assets/)
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
              handler: 'CacheFirst', // 📦 Cache primero para assets estáticos
              options: {
                cacheName: 'local-assets-cache',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año (assets no cambian)
                },
              },
            },
            // 🌐 Estrategia para contenido general (sin API)
            {
              urlPattern: ({ url }) =>
                !url.pathname.includes('/ms-electricians-api/') &&
                !url.pathname.includes('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'general-cache-ops',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24, // 24 horas
                },
              },
            },
          ],
        },
      }),

      // 🔥 Plugin para generar Firebase Service Worker dinámicamente
      {
        name: 'firebase-sw-generator',
        buildStart() {
          // Generar SW con las variables de entorno actuales durante build
          const swContent = `
// Service Worker para Firebase Messaging
importScripts('${env.VITE_FIREBASE_APP_URL}');
importScripts('${env.VITE_FIREBASE_MESSAGE_URL}');

const firebaseConfig = {
  apiKey: "${env.VITE_FIREBASE_API_KEY || ''}",
  authDomain: "${env.VITE_FIREBASE_AUTH_DOMAIN || ''}",
  projectId: "${env.VITE_FIREBASE_PROJECT_ID || ''}",
  storageBucket: "${env.VITE_FIREBASE_STORAGE_BUCKET || ''}",
  messagingSenderId: "${env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}",
  appId: "${env.VITE_FIREBASE_APP_ID || ''}",
  measurementId: "${env.VITE_FIREBASE_MEASUREMENT_ID || ''}"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 🧹 Función para limpiar etiquetas HTML usando regex
const stripHtmlTags = (html) => {
  if (!html) return '';

  // Eliminar todas las etiquetas HTML (todo lo que esté entre < >)
  let cleanText = html.replace(/<[^>]*>/g, '');
  
  // Decodificar entidades HTML comunes
  cleanText = cleanText
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Limpiar espacios extra, saltos de línea y tabs
  return cleanText.replace(/\\s+/g, ' ').trim();
};

messaging.onBackgroundMessage(async (payload) => {
  
  // ✅ VERIFICACIÓN MEJORADA: Solo mostrar si la app está realmente en background
  const clients = await self.clients.matchAll({ 
    type: 'window', 
    includeUncontrolled: true 
  });
  
  const hasVisibleClients = clients.some(client => 
    client.visibilityState === 'visible' && client.focused
  );
  
  
  // ✅ SOLO mostrar notificación si NO hay clientes visibles y enfocados
  if (hasVisibleClients) {
    return; // El hook useFirebasePush maneja foreground
  }
  
  
  try {
    const rawTitle = payload.notification?.title || payload.data?.title || 'Nueva notificación';
    const rawBody = payload.notification?.body || payload.data?.body || '';
    const tag = payload.data?.notification_id || 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 15);
    // 🧹 Limpiar HTML de título y cuerpo
    const notificationTitle = stripHtmlTags(rawTitle);
    const notificationBody = stripHtmlTags(rawBody);
    
    
    const notificationOptions = {
      body: notificationBody,
      icon: payload.notification?.icon || '/icons/icon-512.png', // Icono pequeño (badge)
      badge: '/icons/icon.svg',
      tag: tag,
      requireInteraction: true,
      silent: false,
      data: payload.data || payload || {},
    };

    
    return self.registration.showNotification(notificationTitle, notificationOptions);
  } catch (error) {
    console.error('❌ Error mostrando notificación en background:', error);
    
    // Mostrar notificación de fallback para evitar el error
    const fallbackTitle = stripHtmlTags('Nueva notificación');
    const fallbackBody = stripHtmlTags('Tienes una nueva notificación');
    
    return self.registration.showNotification(fallbackTitle, {
      body: fallbackBody,
      icon: '/icons/icon-512.png', // Icono pequeño (badge)
      badge: '/icons/icon.svg',
      tag: 'firebase-notification-fallback',
      data: payload || {}
    });
  }
});

self.addEventListener('notificationclick', (event) => { 
  event.notification.close();
  
  // Siempre abrir /home?source=notification
  const notificationId = event.notification.data.messageId || event.notification.data.notification_id || 'unknown';
  const url = '/home?source=notification&notification_id=' + notificationId;
  
  event.waitUntil(clients.openWindow(url))
  
});
          `;

          fs.writeFileSync(
            './public/firebase-messaging-sw.js',
            swContent.trim()
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@auth': resolve(__dirname, './src/modules/auth'),
        '@entropy': resolve(__dirname, './src/entropy'),
        '@forms-management': resolve(
          __dirname,
          './src/modules/mobile/forms-management'
        ),
        '@home': resolve(__dirname, './src/modules/mobile/home'),
        '@visits': resolve(__dirname, './src/modules/mobile/visits'),
        '@shared': resolve(__dirname, './src/shared'),
        '@visit-management': resolve(
          __dirname,
          './src/modules/mobile/visit-management'
        ),
        '@desktop': resolve(__dirname, './src/modules/desktop'),
        '@hv': resolve(__dirname, './src/modules/hv'),
        '@mobile': resolve(__dirname, './src/modules/mobile'),
        '@work-orders': resolve(__dirname, './src/modules/desktop/work-orders'),
      },
    },

    // 🎯 Optimizaciones para PWA y Capacitor
    server: {
      host: true, // 📱 Permite acceso desde dispositivos móviles
      port: 8100,
      strictPort: true,
      cors: true, // ✅ CORS habilitado para Capacitor
      // 🔧 Headers específicos para Capacitor
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods':
          'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers':
          'X-Requested-With, Content-Type, Authorization',
      },
    },

    preview: {
      port: 8080,
      host: true,
      cors: true,
    },

    assetsInclude: [
      '**/*.woff',
      '**/*.woff2',
      '**/*.ttf',
      '**/*.eot',
      '**/*.svg',
      '**/*.png',
      '**/*.jpg',
      '**/*.jpeg',
      '**/*.gif', // 📦 Agregado para las imágenes GIF en assets
      '**/*.webp',
      '**/*.avif',
    ],

    define: {
      'process.env': env,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __CAPACITOR_PLATFORM__: JSON.stringify(
        process.env.CAPACITOR_PLATFORM || 'web'
      ),
      __IS_MOBILE__: JSON.stringify(isMobile),
    },

    // 🚀 Optimizaciones adicionales + Capacitor
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@ionic/react',
        '@ionic/react-router',
        'react-router-dom',
        '@tanstack/react-query',
        // 📱 Capacitor Core
        '@capacitor/core',
        '@capacitor/status-bar',
        '@capacitor/splash-screen',
        '@capacitor/keyboard',
        '@capacitor/app',
        '@capacitor/device',
      ],
      exclude: [
        '@capacitor/push-notifications',
        '@capacitor/local-notifications',
        ...(isMobile ? ['@capacitor/ios', '@capacitor/android'] : []),
      ],
    },
  };
});
