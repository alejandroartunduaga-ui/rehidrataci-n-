import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CardEquipmentDetail } from '@mobile/visits/ui/components';

interface EquipmentInfo {
  title: string;
  serial: string;
  brand: string;
  expirationDate: string;
}

interface RenderOptions {
  containerId?: string;
  className?: string;
  style?: React.CSSProperties;
}

class CardEquipmentRenderer {
  private root: Root | null = null;
  private container: HTMLElement | null = null;

  /**
   * Renderiza el componente CardEquipmentDetail en el body
   */
  render(
    equipmentInfo: EquipmentInfo,
    options: RenderOptions = {}
  ): HTMLElement {
    const {
      containerId = 'card-equipment-overlay',
      className = '',
      style = {},
    } = options;

    // Crear o obtener el contenedor
    this.container = document.getElementById(containerId) as HTMLElement;

    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }

    // Aplicar estilos por defecto para overlay
    const defaultStyle: React.CSSProperties = {
      ...style,
    };

    // Aplicar estilos al contenedor
    Object.assign(this.container.style, defaultStyle);

    if (className) {
      this.container.className = className;
    }

    // Crear el root de React
    this.root = createRoot(this.container);

    // Renderizar el componente
    const cardElement = React.createElement(CardEquipmentDetail, {
      title: equipmentInfo.title,
      serial: equipmentInfo.serial,
      brand: equipmentInfo.brand,
      expirationDate: equipmentInfo.expirationDate,
    });

    this.root.render(cardElement);

    return this.container;
  }

  /**
   * Remueve el componente del DOM
   */
  remove(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  /**
   * Actualiza la información del equipo
   */
  update(equipmentInfo: EquipmentInfo): void {
    if (!this.root || !this.container) {
      console.warn('⚠️ No hay componente renderizado para actualizar');
      return;
    }

    const cardElement = React.createElement(CardEquipmentDetail, {
      title: equipmentInfo.title,
      serial: equipmentInfo.serial,
      brand: equipmentInfo.brand,
      expirationDate: equipmentInfo.expirationDate,
    });

    this.root.render(cardElement);
  }

  /**
   * Verifica si el componente está renderizado
   */
  isRendered(): boolean {
    return this.root !== null && this.container !== null;
  }
}

// Instancia singleton para uso global
const cardRenderer = new CardEquipmentRenderer();

// Funciones de utilidad para uso fácil
export const renderCardEquipmentInBody = (
  equipmentInfo: EquipmentInfo,
  options?: RenderOptions
): HTMLElement => {
  return cardRenderer.render(equipmentInfo, options);
};

export const removeCardEquipmentFromBody = (): void => {
  cardRenderer.remove();
};

export const updateCardEquipmentInBody = (
  equipmentInfo: EquipmentInfo
): void => {
  cardRenderer.update(equipmentInfo);
};

export const isCardEquipmentRendered = (): boolean => {
  return cardRenderer.isRendered();
};

// Exportar la clase para uso avanzado
export { CardEquipmentRenderer };
export type { EquipmentInfo, RenderOptions };
