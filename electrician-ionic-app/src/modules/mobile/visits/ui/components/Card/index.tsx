import { HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface IcardPorps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  routerLink?: string;
}

export const Card = ({ children, className, ...props }: IcardPorps) => {
  return (
    <div
      className={`${styles.card} ${className ? className : ''}`}
      {...props}
    >
      {children}
    </div>
  );
};
