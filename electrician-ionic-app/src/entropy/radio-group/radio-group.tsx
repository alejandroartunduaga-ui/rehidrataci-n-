import React, { useState, useEffect } from 'react';
import { IonRadioGroup, IonRadio, IonLabel, IonItem } from '@ionic/react';
import styles from './radio-group.module.css';

interface BiaRadioGroupProps
  extends React.ComponentProps<typeof IonRadioGroup> {
  options: { label: string; value: string }[];
  labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked';
  alignment?: 'start' | 'center';
  justify?: 'start' | 'end' | 'space-between';
  onCheckedChange: (checked: string) => void;
}

export const BiaRadioGroup = React.forwardRef<
  HTMLIonRadioGroupElement,
  BiaRadioGroupProps
>(
  (
    {
      options,
      className,
      labelPlacement = 'end',
      alignment = 'center',
      justify = 'start',
      onCheckedChange,
      ...props
    },
    ref
  ) => {
    const [radioOptions] =
      useState<{ label: string; value: string }[]>(options);
    const [selectedValue, setSelectedValue] = useState<string | undefined>(
      props.value
    );

    // Sincronizar con el valor externo cuando cambie
    useEffect(() => {
      setSelectedValue(props.value);
    }, [props.value]);

    return (
      <div className={`${styles.container_radio_group} ${className}`}>
        <IonRadioGroup
          allowEmptySelection={true}
          value={selectedValue}
          onIonChange={(event) => {
            const newValue = event.detail.value;
            setSelectedValue(newValue);
            onCheckedChange(newValue);
          }}
          ref={ref as React.Ref<HTMLIonRadioGroupElement>}
          {...props}
        >
          {radioOptions.map((option, index) => (
            <IonItem
              key={index}
              className={styles.radio_item}
              lines='none'
              button={true}
              onClick={() => {
                const newValue = option.value;
                setSelectedValue(newValue);
                onCheckedChange(newValue);
              }}
            >
              <IonRadio
                slot='start'
                value={option.value}
                labelPlacement={labelPlacement}
                alignment={alignment}
                justify={justify}
                className={styles.radio}
              />
              <IonLabel className='ion-text-wrap'>{option.label}</IonLabel>
            </IonItem>
          ))}
        </IonRadioGroup>
      </div>
    );
  }
);

BiaRadioGroup.displayName = 'BiaRadioGroup';
