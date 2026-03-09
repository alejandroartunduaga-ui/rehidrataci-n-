import { useTranslation } from 'react-i18next';
import { BiaIcon, BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import { CategoryName } from '@visits/data/interfaces/visits.interface';
import styles from './EmptyScreen.module.css';

interface IemptyScreenProps {
  categoryActive: CategoryName;
}

export const EmptyScreen = ({ categoryActive }: IemptyScreenProps) => {
  const { t } = useTranslation(TranslationNamespaces.VISITS);

  const textEmptyScreen: Record<CategoryName, string> = {
    [CategoryName.POR_ASIGNAR]: t('text_empty_screen_category_assing'),
    [CategoryName.PROXIMAS]: t('text_empty_screen_category_next'),
    [CategoryName.COMPLETADAS]: t('text_empty_screen_category_completed'),
    [CategoryName.FALLIDAS]: t('text_empty_screen_category_Failed'),
    [CategoryName.POR_SYNCRONIZAR]: t('text_empty_screen_category_sync'),
    [CategoryName.DEVUELTAS]: t('text_empty_screen_category_revert'),
  };

  return (
    <div className={styles.emptyScreen}>|
      <div className={styles.emptyScreenIconWrapper}>
        <BiaIcon
          iconName='faHelmetSafety'
          iconType='solid'
          color='accent'
          size='1.5rem' //24px
        />
      </div>

      <BiaText
        token='heading-2'
        className={styles.emptyScreenTitle}
      >
        {t('title_empty_screen')}
      </BiaText>

      <BiaText
        token='bodyRegular'
        className={styles.emptyScreenText}
      >
        {textEmptyScreen[categoryActive]}
      </BiaText>
    </div>
  );
};
