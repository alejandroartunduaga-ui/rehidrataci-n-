import { useState, useEffect } from 'react';
import { BiaIcon, BiaInput } from '@entropy/index';
import styles from './CardFormHv.module.css';
import { TranslationNamespaces } from '@shared/i18n';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY_BIA = 'hv_form_code_bia';
const STORAGE_KEY_SIC = 'hv_form_code_sic';

interface CardFormHvProps {
  onSubmit: (code_bia: string, sic_code: string) => void;
  clearInputs: () => void;
}

export const CardFormHv = ({ onSubmit, clearInputs }: CardFormHvProps) => {
  const { t } = useTranslation(TranslationNamespaces.TECHNICAL_LIFE_SHEET);
  const [codigoBia, setCodigoBia] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY_BIA) || '';
  });
  const [codigoSic, setCodigoSic] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY_SIC) || '';
  });

  // Sincronizar con sessionStorage
  useEffect(() => {
    if (codigoBia) {
      sessionStorage.setItem(STORAGE_KEY_BIA, codigoBia);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_BIA);
    }
  }, [codigoBia]);

  useEffect(() => {
    if (codigoSic) {
      sessionStorage.setItem(STORAGE_KEY_SIC, codigoSic);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_SIC);
    }
  }, [codigoSic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(codigoBia, codigoSic);
  };

  // Función para validar y limpiar caracteres especiales (solo permite letras, números, guiones, espacios y ñ)
  const sanitizeInput = (value: string): string => {
    return value.replace(/[^a-zA-Z0-9\s\-ñÑ]/g, '');
  };

  const isFormValid = codigoBia || codigoSic;

  return (
    <div className={styles.card}>
      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <div className={styles.containerInputs}>
          <BiaInput
            containerClassName={styles.input}
            label={t('card_form_hv.code_bia')}
            placeholder={t('card_form_hv.code_bia_placeholder')}
            value={codigoBia}
            clearable
            disabled={!!codigoSic}
            maxlength={30}
            onIonInput={(e) => {
              const value = e.detail.value || '';
              const sanitizedValue = sanitizeInput(value);
              setCodigoBia(sanitizedValue);
            }}
            onClear={() => {
              setCodigoBia('');
              clearInputs();
            }}
          />

          <BiaInput
            containerClassName={styles.input}
            label={t('card_form_hv.code_sic')}
            placeholder={t('card_form_hv.code_sic_placeholder')}
            value={codigoSic}
            clearable
            disabled={!!codigoBia}
            maxlength={30}
            onIonInput={(e) => {
              const value = e.detail.value || '';
              const sanitizedValue = sanitizeInput(value);
              setCodigoSic(sanitizedValue);
            }}
            onClear={() => {
              setCodigoSic('');
              clearInputs();
            }}
          />
        </div>

        <div className={styles.buttonContainer}>
          <button
            type='submit'
            className={`${styles.buttonSubmit} ${styles.primaryButton}`}
            disabled={!isFormValid}
          >
            <BiaIcon
              iconName='faSearch'
              iconType='solid'
              color='inverse'
            />
            {t('card_form_hv.button_consultar')}
          </button>
        </div>
      </form>
    </div>
  );
};
