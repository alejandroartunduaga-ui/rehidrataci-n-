import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BiaBreadcrumb,
  BiaIcon,
  BiaVisualizer,
  BreadcrumbItem,
  BiaLoader,
  BiaText,
} from '@entropy/index';
import styles from './ViewDocumentHv.module.css';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';

export const ViewDocumentHv = () => {
  const { t } = useTranslation(TranslationNamespaces.TECHNICAL_LIFE_SHEET);
  const { url, version } = useParams<{ url: string; version: string }>();
  const [decodedUrl, setDecodedUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (url) {
      try {
        const decoded = decodeURIComponent(url);
        // Crear objeto URL para manejar parámetros de consulta correctamente
        const urlObj = new URL(decoded);
        setDecodedUrl(urlObj.toString());
        setError(false);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Si la URL no es válida, intentar agregar el parámetro manualmente
        try {
          const decoded = decodeURIComponent(url);
          const separator = decoded.includes('?') ? '&' : '?';
          setDecodedUrl(`${decoded}${separator}zoom=1`);
          setError(false);
        } catch (fallbackError) {
          console.error('Error al decodificar la URL:', fallbackError);
          setError(true);
        }
      }
    }
  }, [url]);

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Hoja de Vida Técnica',
      href: '/admin-regulatory/technical-life-sheet',
    },
    {
      label: version || '',
      active: true,
    },
  ];

  const downloadFile = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className={styles.detailContainer}>
      <BiaBreadcrumb items={breadcrumbItems} />
      {!decodedUrl && !error && <BiaLoader />}
      <div className={styles.contentContainer}>
        <div className={styles.infoContainer}>
          {error && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <BiaText
                token='caption'
                color='error'
              >
                {t('error_load_document')}
              </BiaText>
            </div>
          )}
          {decodedUrl && !error && (
            <BiaVisualizer
              key={decodedUrl}
              src={decodedUrl}
              scaleViewer={0.7}
            />
          )}
        </div>
        {decodedUrl ? (
          <div className={styles.actionsContainer}>
            <button
              type='button'
              className={styles.actionButton}
              onClick={() => {
                downloadFile(decodedUrl);
              }}
            >
              <BiaIcon
                iconName='faFileArrowDown'
                iconType='solid'
                size='16px'
                color='standard'
              />
              {t('download_pdf')}
            </button>
          </div>
        ) : (
          <div
            className={styles.actionsContainer}
            style={{ border: 'none' }}
          ></div>
        )}
      </div>
    </div>
  );
};
