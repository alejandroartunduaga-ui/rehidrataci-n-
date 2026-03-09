import React from 'react';
import styles from './EnvironmentBadge.module.css';
import {
  getCurrentEnvironmentType,
  shouldShowEnvironmentBadge,
} from '@shared/utils/environment.utils';
import type { EnvironmentType } from '@shared/types/environment.types';

interface EnvironmentBadgeProps {
  className?: string;
}

export const EnvironmentBadge: React.FC<EnvironmentBadgeProps> = ({
  className,
}) => {
  const showBadge = shouldShowEnvironmentBadge();
  const environmentType: EnvironmentType = getCurrentEnvironmentType();

  if (!showBadge) {
    return null;
  }

  const badgeClasses = [
    styles.environmentBadge,
    styles[environmentType],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={badgeClasses}
      data-testid='environment-badge'
    >
      {environmentType}
    </div>
  );
};
