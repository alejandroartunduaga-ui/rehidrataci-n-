import { Link } from 'react-router-dom';
import { BiaIcon, BiaText } from '@entropy/index';
import { dateExtended } from '@shared/utils/date';
import { IField } from '@visits/data/interfaces/visitDetail.interface';
import { MapField } from '../MapField';
import styles from './RenderField.module.css';

interface IRenderFieldProps {
  field: IField;
  id?: string;
  onClick?: () => void;
}

enum FieldType {
  LABEL = 'LABEL',
  PIN = 'PIN',
  MULTIPLE_LINE_LABEL_WITH_ICON = 'MULTIPLE_LINE_LABEL_WITH_ICON',
  MAP = 'MAP',
  PREVIEW_BUTTON = 'PREVIEW_BUTTON',
  SCOPE = 'scope',
  EQUIPMENTS = 'equipments',
}

export const RenderField = ({ field, id, onClick }: IRenderFieldProps) => {
  if (field.type === FieldType.LABEL) {
    return (
      <div
        className={styles.filedWrapper}
        style={
          field.name === 'work_order'
            ? {
                borderBottom: 'none',
              }
            : {
                borderBottom: '1px solid var(--border-standard)',
              }
        }
        id={id}
      >
        <BiaText
          token='heading-3'
          color='standard'
          className={styles.fieldTitle}
        >
          {field.title}:{' '}
        </BiaText>

        <BiaText
          token='bodyRegular'
          color='weak'
        >
          {field.title === 'Fecha'
            ? dateExtended(field.selected_value[0])
            : field?.selected_value[0]}
        </BiaText>
      </div>
    );
  }

  if (field.type === FieldType.PIN) {
    return (
      <div
        className={styles.filedWrapper}
        id={id}
      >
        <BiaText
          token='heading-3'
          color='standard'
          className={styles.fieldTitle}
        >
          {field.title}:
        </BiaText>

        <div
          className={styles.pin}
          style={{ background: field.color }}
        >
          <BiaText
            token='label'
            color='inverse'
          >
            {field.selected_value && field.selected_value[0]}
          </BiaText>
        </div>
      </div>
    );
  }

  if (field.type === FieldType.MULTIPLE_LINE_LABEL_WITH_ICON) {
    return (
      <div
        className={styles.filedWrapper}
        id={id}
      >
        <div className={styles.multiple_line_label_with_icon}>
          <img
            src={field.icon_url}
            alt='icon'
          />

          <div className={styles.textContent}>
            <BiaText token='heading-3'>{field.title}</BiaText>
            <BiaText token='bodyRegular'>{field.selected_value}</BiaText>
          </div>
        </div>
      </div>
    );
  }

  if (field.type === FieldType.MAP) {
    return (
      <div
        className={styles.mapFiledWrapper}
        id={id}
      >
        <BiaText
          token='bodyRegular'
          color='weak'
        >
          Ubicación
        </BiaText>
        <MapField position={field.data as { lat: number; long: number }} />
      </div>
    );
  }

  if (field.type === FieldType.PREVIEW_BUTTON) {
    return (
      <div
        className={styles.filedWrapper}
        id={id}
      >
        <Link
          to={`/visit/documents/${encodeURIComponent(
            field.data &&
              typeof field.data === 'object' &&
              'button_link' in field.data
              ? field.data.button_link[0]
              : 'error'
          )}/${field.title}`}
          className={styles.previewButton}
        >
          <div className={styles.previewButtonLeft}>
            <img
              src={field.icon_url}
              alt='icon'
            />

            <BiaText
              token='bodyRegular'
              color='weak'
            >
              {field.title}
            </BiaText>
          </div>

          <BiaIcon
            iconType='solid'
            iconName='faChevronRight'
          />
        </Link>
      </div>
    );
  }
  if (field.type === FieldType.SCOPE) {
    return (
      <div
        onClick={onClick}
        className={styles.filedWrapper + ' ' + styles.scopeWrapper}
        id={id}
      >
        <BiaText token='heading-3'>{field.title}</BiaText>
        <BiaIcon
          iconType='solid'
          iconName='faChevronRight'
        />
      </div>
    );
  }
  if (field.type === FieldType.EQUIPMENTS) {
    return (
      <div
        onClick={onClick}
        className={styles.filedWrapper + ' ' + styles.equipmentsWrapper}
        id={id}
      >
        <BiaText token='heading-3'>{field.title}</BiaText>
        <BiaIcon
          iconType='solid'
          iconName='faChevronRight'
        />
      </div>
    );
  }
};
