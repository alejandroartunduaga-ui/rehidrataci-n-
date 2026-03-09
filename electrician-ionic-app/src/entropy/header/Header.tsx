import { IonButtons, IonHeader, IonMenuToggle } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { BiaIcon } from '@entropy/icon/Icon';
import { BiaText } from '@entropy/text/text';
import styles from './header.module.css';

interface IheaderProps {
  menuIcon?: boolean;
  backButton?: boolean;
  iconLeft?: string;
  iconLeftType?: 'solid' | 'regular' | 'biaicon';
  iconBackButton?: string;
  text: string;
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
  headerModal?: boolean;
  usModal?: boolean;
  onIconLeftClick?: () => void;
  onIconRightClick?: () => void;
}

export const Header: React.FC<IheaderProps> = ({
  backButton = false,
  iconBackButton = 'faChevronLeft',
  menuIcon = false,
  iconLeftType = 'solid',
  iconLeft,
  text,
  showNotifications = false,
  notificationCount = 0,
  onNotificationClick,
  headerModal = false,
  usModal = false,
  onIconLeftClick,
  onIconRightClick,
}) => {
  const history = useHistory();
  const [isAnimating, setIsAnimating] = useState(false);
  const prevNotificationCount = useRef(notificationCount);

  // 🔔 Detectar cambios en notificationCount y activar animación
  useEffect(() => {
    if (
      notificationCount > prevNotificationCount.current &&
      notificationCount > 0
    ) {
      setIsAnimating(true);

      // Remover la animación después de que termine
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Duración de la animación

      return () => clearTimeout(timer);
    }

    prevNotificationCount.current = notificationCount;
  }, [notificationCount]);

  const handleGoBack = () => {
    history.go(-1);
  };

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  return (
    <IonHeader className={headerModal ? styles.headerModal : ''}>
      <header className={styles.header}>
        {backButton &&
          (usModal ? (
            <IonButtons onClick={onIconRightClick}>
              <BiaIcon
                iconName={iconBackButton}
                iconType='solid'
                size='1.25em' // 20px
              />
            </IonButtons>
          ) : (
            <IonButtons onClick={handleGoBack}>
              <BiaIcon
                iconName={iconBackButton}
                iconType='solid'
                size='1.25em' // 20px
              />
            </IonButtons>
          ))}

        {menuIcon && (
          <IonMenuToggle>
            <BiaIcon
              iconName='faBars'
              iconType='solid'
              size='1.25em' // 20px
            />
          </IonMenuToggle>
        )}

        <div className={styles.longtext}>
          <BiaText
            token='heading-2'
            color='standard'
            className={styles.longtext}
          >
            {text}
          </BiaText>
        </div>

        <IonButtons>
          {showNotifications && (
            <button
              onClick={handleNotificationClick}
              className={`${styles.notificationButton} ${isAnimating ? styles.bellAnimation : ''}`}
            >
              <BiaIcon
                iconName='faBell'
                iconType='regular'
                size='1.25rem'
                className={`${styles.notificationIcon}`}
              />
              {notificationCount > 0 && (
                <span className={styles.notificationCount}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}
          {iconLeft && (
            <button
              className={styles.iconLeftButton}
              onClick={onIconLeftClick}
            >
              <BiaIcon
                iconType={iconLeftType}
                iconName={iconLeft}
                size='1.25em' // 20px
              />
            </button>
          )}
        </IonButtons>
      </header>
    </IonHeader>
  );
};
