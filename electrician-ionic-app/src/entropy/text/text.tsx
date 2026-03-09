import React from 'react';
import { IonText } from '@ionic/react';

/**
 * Props para el componente BiaText.
 *
 * Este componente permite mostrar texto estilizado con variantes predefinidas para encabezados,
 * cuerpos de texto, etiquetas, entre otros. Además, admite el uso de colores basados en
 * las variables CSS del tema.
 */
export interface TextProps {
  /**
   * Variante del estilo tipográfico que se va a aplicar al texto.
   *
   * Los tokens predefinidos determinan el tamaño, peso y altura de línea del texto.
   *
   * @example 'heading-1'
   * @example 'bodyRegular'
   */
  token:
    | 'heading-1'
    | 'heading-2'
    | 'heading-3'
    | 'bodyRegular'
    | 'bodySemibold'
    | 'caption'
    | 'label';

  /**
   * Color del texto basado en las variables CSS del tema.
   *
   * Solo permite valores predefinidos vinculados a los colores temáticos, como `strong`, `accent`,
   * `positive`, entre otros.
   *
   * @default 'strong'
   *
   * @example 'accent' para aplicar el color de acento.
   * @example 'positive' para aplicar un color verde positivo.
   */
  color?: keyof typeof colors;

  /**
   * Clase CSS adicional que se puede agregar para estilos personalizados.
   *
   * Se utiliza para añadir clases adicionales o sobrescribir estilos predefinidos.
   *
   * @example 'custom-class' para aplicar estilos personalizados desde tu hoja de estilos.
   */
  className?: string;

  /**
   * El contenido de texto que se va a renderizar.
   *
   * Se puede pasar cualquier nodo de React como hijo, incluyendo texto o componentes anidados.
   *
   * @example `<BiaText token="bodyRegular">Este es un cuerpo de texto.</BiaText>`
   */
  children?: React.ReactNode;

  /**
   * Contenido HTML para renderizar dentro del componente.
   * Si se provee este prop, tiene prioridad sobre `children`.
   */
  html?: string;
}

const fontStyles = {
  'heading-1': { fontWeight: 600, fontSize: '20px', lineHeight: '24px' },
  'heading-2': { fontWeight: 600, fontSize: '16px', lineHeight: '24px' },
  'heading-3': { fontWeight: 600, fontSize: '14px', lineHeight: '16px' },
  bodyRegular: { fontWeight: 400, fontSize: '14px', lineHeight: '16px' },
  bodySemibold: { fontWeight: 600, fontSize: '14px', lineHeight: '16px' },
  caption: { fontWeight: 400, fontSize: '12px', lineHeight: '16px' },
  label: { fontWeight: 400, fontSize: '10px', lineHeight: '16px' },
};

const colors = {
  strong: 'var(--ink-strong)',
  standard: 'var(--ink-standard)',
  standardOn: 'var(--ink-standard-on)',
  weak: 'var(--ink-weak)',
  disabled: 'var(--ink-disabled)',
  inverse: 'var(--ink-inverse)',
  inverseOn: 'var(--ink-inverse-on)',
  inverseOff: 'var(--ink-inverse-off)',
  accent: 'var(--ink-accent)',
  positive: 'var(--ink-positive)',
  warning: 'var(--ink-warning)',
  error: 'var(--ink-error)',
  recommendation: 'var(--ink-recommendation)',
  blue02: 'var(--chart-blue02)',
};

export const BiaText: React.FC<TextProps> = ({
  token,
  color = 'strong',
  className,
  children,
  html,
}) => {
  const style = {
    ...fontStyles[token], // Aplica las variantes de texto según el token
    color: colors[color], // Aplica el color según la variable proporcionada
    fontFamily: 'Open Sauce', // Utiliza la fuente de Open Sauce
  };

  if (html) {
    return (
      <IonText
        style={style}
        className={className}
      >
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </IonText>
    );
  }

  return (
    <IonText
      style={style}
      className={className}
    >
      {children}
    </IonText>
  );
};
