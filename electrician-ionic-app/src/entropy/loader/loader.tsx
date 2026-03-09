import React from 'react';
import { useGlobalLoaderStore } from '@shared/store/globalLoaderStore';
import { BiaText } from '@entropy/text/text';
import styles from './loader.module.css';
import { IonImg } from '@ionic/react';

interface BiaLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  color?: 'inverse' | 'accent';
}

export const BiaLoader: React.FC<BiaLoaderProps> = ({
  text,
  className,
  color = 'inverse',
}) => {
  const forceHide = useGlobalLoaderStore((state) => state.forceHide);

  if (forceHide) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.loaderPage} ${className ? className : ''}`}>
        {text && (
          <div className={styles.textWrapper}>
            <BiaText
              color={color}
              token='bodyRegular'
            >
              {text}
            </BiaText>
          </div>
        )}
        <IonImg
          src='/assets/img/git-loader.gif'
          alt='Cargando...'
          className={styles.gifLoader}
        />
      </div>
    </div>
  );
};
