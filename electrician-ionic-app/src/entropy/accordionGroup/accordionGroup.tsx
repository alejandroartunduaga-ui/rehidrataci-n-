import React from 'react';
import { IonAccordionGroup } from '@ionic/react';
import styles from './accordionGroup.module.css';

/**
 * BiaChackbox es un componente personalizado que envuelve a IonCheckbox.
 * Acepta todas las propiedades de IonCheckbox.
 */
interface BiaAccordionProps
  extends React.ComponentProps<typeof IonAccordionGroup> {
  title?: string;
  multiple?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  expand?: 'compact' | 'inset';
}

export const BiaAccordionGroup = React.forwardRef<
  HTMLIonAccordionGroupElement,
  BiaAccordionProps
>(
  (
    {
      children,
      className,
      multiple = true,
      disabled = false,
      readonly = false,
      expand = 'compact',
      ...props
    },
    ref
  ) => {
    return (
      <IonAccordionGroup
        ref={ref as React.Ref<HTMLIonAccordionGroupElement>}
        multiple={multiple}
        disabled={disabled}
        readonly={readonly}
        expand={expand}
        {...props}
        className={`${styles.container_accordion} ${className}`}
      >
        {children}
      </IonAccordionGroup>
    );
  }
);
