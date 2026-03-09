import styles from './tag.module.css';

interface BiaTagProps {
  color:
    | 'success'
    | 'warning-orange'
    | 'warning'
    | 'error'
    | 'purple'
    | 'magenta'
    | 'blue'
    | 'teal'
    | 'info-yellow'
    | 'yellow'
    | 'disabled';
  corner: 'corner' | 'rounded' | 'square';
  text: string;
  size?: 'small' | 'medium';
  className?: string;
}

const stylesByColor = {
  success: {
    backgroundColor: 'var(--chart-green05)',
    color: 'var(--chart-green02)',
  },
  'warning-orange': {
    backgroundColor: 'var(--chart-orange03)',
    color: 'var(--chart-orange01)',
  },
  warning: {
    backgroundColor: 'var(--chart-orange05)',
    color: 'var(--chart-orange02)',
  },
  error: {
    backgroundColor: 'var(--chart-red05)',
    color: 'var(--chart-red02)',
  },
  purple: {
    backgroundColor: 'var(--chart-purple05)',
    color: 'var(--chart-purple02)',
  },
  magenta: {
    backgroundColor: 'var(--chart-magenta05)',
    color: 'var(--chart-magenta02)',
  },
  blue: {
    backgroundColor: 'var(--chart-blue05)',
    color: 'var(--chart-blue02)',
  },
  teal: {
    backgroundColor: 'var(--chart-teal05)',
    color: 'var(--chart-teal02)',
  },
  yellow: {
    backgroundColor: 'var(--chart-yellow05)',
    color: 'var(--chart-yellow02)',
  },
  'info-yellow': {
    backgroundColor: 'var(--chart-yellow05)',
    color: 'var(--chart-yellow70)',
  },
  disabled: {
    backgroundColor: 'var(--greys-grey-20)',
    color: 'var(--ink-standard)',
  },
};

export const BiaTag: React.FC<BiaTagProps> = ({
  color,
  corner,
  text,
  size = 'medium',
  className,
}) => {
  return (
    <div
      style={{ ...stylesByColor[color] }}
      className={`${styles.tag} ${styles[corner]} ${styles[size]} ${className ? className : ''}`}
    >
      {text}
    </div>
  );
};
