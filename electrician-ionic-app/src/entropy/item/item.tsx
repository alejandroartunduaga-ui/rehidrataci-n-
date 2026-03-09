import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { BiaText } from '@entropy/text/text';
import styles from './item.module.css';

interface BiaItemProps extends React.ComponentProps<typeof IonItem> {
  text: string;
  children?: React.ReactNode;
  slotChildren?: 'start' | 'end';
  disabled?: boolean;
}

export const BiaItem = React.forwardRef<HTMLIonItemElement, BiaItemProps>(
  (
    { text, children, slotChildren = 'start', disabled = false, ...props },
    ref
  ) => {
    return (
      <IonItem
        ref={ref}
        button
        disabled={disabled}
        className={styles.wrapItem}
        {...props}
      >
        <div className={styles.contentItem}>
          {slotChildren === 'start' && children}
          <IonLabel>
            <BiaText
              token='bodySemibold'
              color='standard'
            >
              {text}
            </BiaText>
          </IonLabel>
          {slotChildren === 'end' && children}
        </div>
      </IonItem>
    );
  }
);
