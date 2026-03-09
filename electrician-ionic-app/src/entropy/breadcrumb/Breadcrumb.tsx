import { Link } from 'react-router-dom';
import { BiaIcon } from '@entropy/index';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export const BiaBreadcrumb = ({ items }: { items: BreadcrumbItem[] }) => {
  return (
    <nav
      className={styles.breadcrumbNav}
      aria-label='breadcrumb'
    >
      <ol className={styles.breadcrumbList}>
        {items.map((item, idx) => (
          <li
            key={item.label}
            className={styles.breadcrumbItem}
          >
            {item.href && !item.active ? (
              <Link
                to={item.href}
                className={styles.breadcrumbLink}
              >
                {item.label}
              </Link>
            ) : (
              <span className={styles.breadcrumbCurrent}>{item.label}</span>
            )}
            {idx < items.length - 1 && (
              <BiaIcon
                iconName='faChevronRight'
                iconType='solid'
                size='12px'
                color='weak'
                className={styles.breadcrumbIcon}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
