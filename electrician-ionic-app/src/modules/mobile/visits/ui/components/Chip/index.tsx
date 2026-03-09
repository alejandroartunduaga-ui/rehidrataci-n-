import { BiaText } from '@entropy/index';
import styles from './Chip.module.css';

interface IchipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const Chip = ({ label, active = false, onClick }: IchipProps) => {
  const colorLabel = active ? 'inverse' : 'weak';

  return (
    <button
      onClick={onClick && onClick}
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
    >
      <BiaText
        token='caption'
        color={colorLabel}
      >
        {label}
      </BiaText>
    </button>
  );
};
