import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import * as regularIcons from '@fortawesome/pro-regular-svg-icons';
import * as solidIcons from '@fortawesome/pro-solid-svg-icons';
import { iconSet } from './iconset';
import './icon.css';

/**
 * Props para el componente BiaIcon.
 *
 * Este componente permite el uso de íconos provenientes de dos librerías de FontAwesome
 * (regular y solid), así como de un set de íconos personalizados (biaicon).
 *
 * Adicionalmente, el componente admite variantes de color y tamaño que pueden ser
 * aplicadas a los íconos de manera dinámica.
 */
export interface IconProps {
  /**
   * ID del ícono.
   *
   * @example 'icon-1' para un ícono con un ID específico.
   */
  id?: string;

  /**
   * Nombre del ícono que se va a renderizar.
   *
   * - Para los íconos de FontAwesome (regular y solid), debe coincidir con uno de los nombres
   *   de los íconos importados (como 'faSignOutAlt').
   * - Para los íconos personalizados (biaicon), debe coincidir con el nombre definido en el set
   *   de íconos personalizados.
   *
   * @example 'faSignOutAlt' para FontAwesome
   * @example 'visa' para un ícono personalizado
   */
  iconName: keyof typeof regularIcons | keyof typeof solidIcons | string;

  /**
   * Tipo de ícono que se va a renderizar.
   *
   * - 'regular': Utiliza íconos regulares de FontAwesome.
   * - 'solid': Utiliza íconos sólidos de FontAwesome.
   * - 'biaicon': Utiliza íconos personalizados definidos en el set de íconos (IcoMoon, etc.).
   *
   * @example 'regular' para íconos regulares.
   * @example 'solid' para íconos sólidos.
   * @example 'biaicon' para íconos personalizados.
   */
  iconType: 'regular' | 'solid' | 'biaicon';

  /**
   * Color del ícono, basado en las variables de color CSS definidas en el tema.
   *
   * Solo permite valores específicos correspondientes a los nombres de variables CSS
   * que están vinculados a los colores del tema.
   *
   * @default 'strong'
   *
   * @example 'accent' para usar el color de acento del tema.
   * @example 'positive' para un color verde de confirmación.
   */
  color?: keyof typeof colors;

  /**
   * Tamaño del ícono, aceptando cualquier valor válido en CSS para `font-size`.
   *
   * Puede ser una unidad de medida CSS como píxeles (px), em, rem, etc.
   *
   * @default '1em'
   *
   * @example '16px' para un ícono de 16 píxeles.
   * @example '2rem' para un ícono de 2 rem.
   */
  size?: string;

  /**
   * Clase CSS adicional que se puede agregar para estilos personalizados.
   *
   * Se utiliza para agregar estilos adicionales o sobrescribir los predeterminados.
   *
   * @example 'custom-class' para aplicar estilos personalizados desde tu hoja de estilos.
   */
  className?: string;
}

// Definir los colores permitidos
export const colors = {
  strong: 'var(--ink-strong)',
  standard: 'var(--ink-standard)',
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
  green05: 'var(--chart-green05)',
  green02: 'var(--chart-green02)',
  blue01: 'var(--chart-blue01)',
};

export const BiaIcon = ({
  id,
  iconName,
  iconType,
  className,
  color = 'strong',
  size = '1em',
}: IconProps) => {
  let selectedIcon: IconDefinition | undefined;

  // Obtener el color seleccionado basado en la clave
  const iconColor = colors[color] || colors.strong;

  // Definir estilos dinámicos
  const iconStyles = {
    color: iconColor,
    fontSize: size,
  };

  switch (iconType) {
    case 'regular':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectedIcon = (regularIcons as any)[iconName] as IconDefinition;
      break;
    case 'solid':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectedIcon = (solidIcons as any)[iconName] as IconDefinition;
      break;
    case 'biaicon': {
      const cssMainClassName = `icon-${iconName}`;
      const iconElement = iconSet.icons.find((element) =>
        element.icon.tags.includes(iconName)
      );

      if (!iconElement) {
        return null;
      }

      const pathCount = iconElement.icon.paths.length || 1;
      const classNameIcon = `${cssMainClassName} ${className || ''}`;

      return (
        <span
          className={classNameIcon}
          style={iconStyles}
        >
          {Array.from({ length: pathCount }, (_, index) => (
            <span
              className={`path${index + 1}`}
              key={index}
            ></span>
          ))}
        </span>
      );
    }
  }

  if (!selectedIcon) {
    return null;
  }

  return (
    <FontAwesomeIcon
      id={id}
      data-testid={`${id}-icon`}
      icon={selectedIcon}
      className={className}
      style={iconStyles}
      color={iconColor}
    />
  );
};
