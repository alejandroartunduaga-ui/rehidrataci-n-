# 🔔 Firebase Push Notifications - Configuración Simplificada

## ✅ **Qué está listo:**

1. ✅ Hook `useFirebasePush` creado
2. ✅ **Service Worker dinámico** - Se genera automáticamente con tus variables de entorno
3. ✅ Capacitor config actualizado  
4. ✅ Dependencias instaladas (`@capacitor/push-notifications`)
5. ✅ **Integrado con tu configuración existente** de Firebase (`webFirebaseConfig.ts`)

## 🔧 **Solo necesitas configurar VAPID Key:**

### 1. **Obtener VAPID Key de Firebase Console**

1. Ve a **Firebase Console** > **Project Settings** > **Cloud Messaging**
2. En **Web configuration** > **Web Push certificates**
3. Genera o copia tu **Key pair**
4. Agrega a tu `.env`:

```env
VITE_FIREBASE_VAPID_KEY=tu-vapid-key-de-firebase
```

## 🚀 **¡Eso es todo! El resto es automático:**

### ⚡ **Generación automática del Service Worker:**
- Al ejecutar `npm run dev` o `npm run build`
- Vite automáticamente genera `public/firebase-messaging-sw.js`
- **Usa tus variables de entorno existentes** de `webFirebaseConfig.ts`
- **Diferentes configuraciones** para desarrollo vs producción

### 🔧 **Sin configuración manual:**
- ❌ No necesitas editar archivos de service worker
- ❌ No necesitas duplicar configuración de Firebase  
- ❌ No necesitas preocuparte por ambientes diferentes
- ✅ **Todo automático** basado en tu configuración actual

## 🚀 **Cómo usar:**

```typescript
import { useFirebasePush } from '@shared/hooks/useFirebasePush';

const MyComponent = () => {
  const { state, requestPermissions, getToken } = useFirebasePush();

  const setupNotifications = async () => {
    // 1. Solicitar permisos
    await requestPermissions();
    
    // 2. Obtener token
    if (state.hasPermission) {
      const token = await getToken();
      // 3. Enviar token a tu backend
      // await sendTokenToYourBackend(token);
    }
  };

  return (
    <div>
      <p>Permisos: {state.hasPermission ? '✅' : '❌'}</p>
      <p>Registrado: {state.isRegistered ? '✅' : '❌'}</p>
      <button onClick={setupNotifications}>
        Configurar Notificaciones
      </button>
    </div>
  );
};
```

## 📱 **Compatibilidad:**

- ✅ **iOS nativo** - Via Capacitor + Firebase
- ✅ **Android nativo** - Via Capacitor + Firebase  
- ✅ **Web/PWA** - Via Firebase Messaging + Service Worker

## 🔄 **Próximos pasos:**

1. ✅ Agregar VAPID key a `.env`
2. 🔄 Probar notificaciones en navegador/dispositivo
3. 🔄 Integrar contador con el Header (ya está preparado)
4. 🔄 Enviar token a tu backend para notificaciones desde servidor

## 📱 **Ejemplo de integración con Header:**

```typescript
import { useFirebasePush } from '@shared/hooks/useFirebasePush';

const MyPage = () => {
  const { state } = useFirebasePush();
  
  return (
    <Header
      text="Mi Página"
      showNotifications={true}
      notificationCount={state.notificationsReceived}
      onNotificationClick={() => {
        console.log('Ver notificaciones');
      }}
    />
  );
};
```

## 🔄 **Flujo completo:**

1. **Usuario abre app** → Hook se inicializa automáticamente
2. **Solicita permisos** → Usuario acepta
3. **Obtiene token** → Se puede enviar a backend
4. **Firebase envía notificación** → Service worker la recibe
5. **App muestra contador** → En el Header

## 🐛 **Troubleshooting:**

- **Error "VAPID key not configured"**: Agrega `VITE_FIREBASE_VAPID_KEY` a tu `.env`
- **Service Worker no se genera**: Ejecuta `npm run dev` o `npm run build`
- **No recibo notificaciones**: Verifica que Firebase Console tenga la VAPID key configurada
- **Errores de permisos**: Asegúrate de que el usuario aceptó las notificaciones en el navegador
