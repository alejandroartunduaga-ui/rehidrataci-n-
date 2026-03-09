import { useState } from 'react';
import { useIonRouter } from '@ionic/react';
import { BiaIcon } from '@entropy/index';
import styles from './SidebarHv.module.css';

export const SidebarHv = () => {
  const router = useIonRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const routes = [
    {
      name: 'HV técnica',
      icon: 'faFileAlt',
      path: '/admin-regulatory/technical-life-sheet',
    },
    {
      name: 'Alcances',
      icon: 'faCircleStop',
      path: '/admin-regulatory/scopes',
    },
  ];

  return (
    <div
      className={`${styles.sidebarContainer} ${isCollapsed ? styles.collapsed : ''}`}
    >
      <button
        className={styles.buttonCollapse}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <BiaIcon
          iconName={isCollapsed ? 'faChevronRight' : 'faChevronLeft'}
          iconType='solid'
        />
      </button>
      {routes.map((route) => (
        <button
          key={route.path}
          className={`${styles.item} ${router.routeInfo.pathname.includes(route.path) ? styles.active : ''}`}
          onClick={() => {
            router.push(route.path);
          }}
        >
          <BiaIcon
            className={`${styles.itemIcon} ${router.routeInfo.pathname.includes(route.path) ? styles.active : ''}`}
            iconName={route.icon}
            iconType={
              router.routeInfo.pathname.includes(route.path)
                ? 'solid'
                : 'regular'
            }
          />
          <span className={styles.itemName}>{route.name}</span>
        </button>
      ))}
    </div>
  );
};
