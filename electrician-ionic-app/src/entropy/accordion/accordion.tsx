import React from 'react';
import { IonAccordion } from '@ionic/react';
import styles from './accordion.module.css';

/**
 * BiaAccordion es un componente personalizado que envuelve a IonAccordion.
 * Acepta todas las propiedades de IonAccordion.
 */
interface BiaAccordionProps extends React.ComponentProps<typeof IonAccordion> {
  /**
   * Título del acordeón que se muestra en el header
   */
  className?: string;
}

export const BiaAccordion = React.forwardRef<
  HTMLIonAccordionElement,
  BiaAccordionProps
>(({ children, className, ...props }, ref) => {
  return (
    <IonAccordion
      ref={ref as React.Ref<HTMLIonAccordionElement>}
      className={`${styles.accordion} ${className || ''}`}
      {...props}
    >
      {children}
    </IonAccordion>
  );
});
