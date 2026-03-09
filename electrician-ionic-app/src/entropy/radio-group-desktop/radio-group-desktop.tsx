import React, { useState } from 'react';
import { IonRadioGroup, IonRadio, IonLabel, IonItem } from '@ionic/react';
import styles from './radio-group-desktop.module.css';

interface BiaRadioGroupDesktopProps
  extends React.ComponentProps<typeof IonRadioGroup> {
  options: { label: string; value: string }[];
  labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked';
  alignment?: 'start' | 'center';
  justify?: 'start' | 'end' | 'space-between';
  orientation?: 'horizontal' | 'vertical';
  onCheckedChange: (checked: string) => void;
}

export const BiaRadioGroupDesktop = React.forwardRef<
  HTMLIonRadioGroupElement,
  BiaRadioGroupDesktopProps
>(
  (
    {
      options,
      className,
      labelPlacement = 'end',
      alignment = 'center',
      justify = 'start',
      onCheckedChange,
      orientation = 'horizontal',
      ...props
    },
    ref
  ) => {
    const [radioOptions] =
      useState<{ label: string; value: string }[]>(options);

    return (
      <div className={` ${className}`}>
        <IonRadioGroup
          allowEmptySelection={true}
          onIonChange={(event) => {
            onCheckedChange(event.detail.value);
          }}
          ref={ref as React.Ref<HTMLIonRadioGroupElement>}
          {...props}
          className={`${styles.radio_group} ${
            orientation === 'vertical' ? styles.vertical : ''
          }`}
        >
          {radioOptions.map((option, index) => (
            <IonItem
              key={index}
              className={styles.radio_item}
            >
              <IonRadio
                value={option.value}
                labelPlacement={labelPlacement}
                alignment={alignment}
                justify={justify}
                className={styles.radio}
              >
                <IonLabel className={styles.radio_label}>
                  {option.label}
                </IonLabel>
              </IonRadio>
            </IonItem>
          ))}
        </IonRadioGroup>
      </div>
    );
  }
);

BiaRadioGroupDesktop.displayName = 'BiaRadioGroupDesktop';
