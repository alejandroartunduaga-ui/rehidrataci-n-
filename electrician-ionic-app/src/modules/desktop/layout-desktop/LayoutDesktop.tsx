import React from 'react';
import { useTranslation } from 'react-i18next';
import { IonContent, IonPage } from '@ionic/react';
import { BiaToast } from '@entropy/index';
import { HeaderDesktop } from '@shared/components/HeaderDesktop/HeaderDesktop';
import { SidebarDesktop } from '@shared/components/SidebarDesktop/SidebarDesktop';
import { useConnectivityStore, useScrollStore } from '@shared/index';
import { useGlobalLoaderStore } from '@shared/store/globalLoaderStore';
import styles from './LayoutDesktop.module.css';

export const LayoutDesktop: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation('global');
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const [showOfflineToast, setShowOfflineToast] = React.useState(false);
  const setForceHide = useGlobalLoaderStore((state) => state.setForceHide);
  const { setIsScrolling, setScrollY } = useScrollStore();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOnline === false) {
      setShowOfflineToast(true);
      setForceHide(true);
    } else if (isOnline === true) {
      setShowOfflineToast(false);
      setForceHide(false);
    }
  }, [isOnline, setForceHide]);

  React.useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollTop = contentElement.scrollTop;

      setIsScrolling(true);
      setScrollY(scrollTop);

      // Limpiar el timeout anterior
      clearTimeout(scrollTimeout);

      // Después de 150ms sin scroll, marcar como no scrolling
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    contentElement.addEventListener('scroll', handleScroll);

    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [setIsScrolling, setScrollY]);

  return (
    <IonPage>
      <IonContent>
        <HeaderDesktop />
        <div className={styles.container}>
          <div className={styles.sidebar}>
            <SidebarDesktop />
          </div>
          <div
            ref={contentRef}
            className={styles.content}
          >
            {children}
          </div>
        </div>
        {showOfflineToast && (
          <BiaToast
            theme='error'
            message={t('title_no_network')}
            duration={10000}
            onClose={() => setShowOfflineToast(false)}
          />
        )}
      </IonContent>
    </IonPage>
  );
};
