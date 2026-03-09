import { IonButton } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useUser } from '@auth/index';
import { useAuthStore } from '@shared/store/auth/useAuthStore';
import { VERSION, VERSIONDB } from '@shared/data/version.global';
import { useQuickCacheClear } from '@shared/hooks/useCacheCleaner';
import style from './VersionApp.module.css';
import { useFirebasePush } from '@shared/hooks/useFirebasePush';
import { fetchNotificationsUnsubscribe } from '@shared/data/NotificationsUnsubscribe';
import { signOut } from 'firebase/auth';
import { authFirebase } from '@shared/firebase/webFirebaseConfig';

const VersionApp = () => {
  const { user, logout } = useAuthStore();
  const { userDetailsMutation } = useUser();
  const [newVersion, setNewVersion] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showTextDbVersion, setShowTextDbVersion] = useState<boolean>(false);
  const { state, getToken } = useFirebasePush();
  const { clearCache } = useQuickCacheClear();

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = () => {
    userDetailsMutation.mutate();
  };

  const handleLogout = async () => {
    try {
      // Intentar obtener token si no está en estado
      let tokenToUnsubscribe = state.token;

      if (!tokenToUnsubscribe) {
        tokenToUnsubscribe = await getToken();
      }

      // Desuscribir de notificaciones si hay token
      if (tokenToUnsubscribe) {
        await fetchNotificationsUnsubscribe(tokenToUnsubscribe);
      }
    } catch (error) {
      console.error('Error al desuscribir de notificaciones:', error);
    } finally {
      await signOut(authFirebase);
      // Hacer logout independientemente del resultado de la desuscripción
      logout();
    }
  };

  useEffect(() => {
    if (user) {
      setNewVersion(user.version_app[0]);
      if (user.version_app[0] !== VERSION) {
        setShowModal(true);
      }
      if (user.version_db !== VERSIONDB) {
        setShowModal(true);
        setShowTextDbVersion(true);
      }
    }
  }, [user]);

  return (
    <div className={`${showModal ? style.wrap_version_app : style.hide}`}>
      <div className={style.modal_version}>
        <p>
          Actualiza a la versión {newVersion} para disfrutar de las últimas
          novedades.
        </p>
        {showTextDbVersion && (
          <span className={style.text_db_version}>
            Ten en cuenta que en esta version se va actualizar la base de datos
            y se cerrara la sesión.
          </span>
        )}

        <IonButton
          expand='block'
          className={style.rejectButton}
          onClick={() => {
            clearCache();
            if (showTextDbVersion) {
              handleLogout();
            }
          }}
        >
          {showTextDbVersion ? 'Cerrar sesión' : 'Actualizar'}
        </IonButton>
      </div>
    </div>
  );
};

export default VersionApp;
