import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { BiaLoader, Header } from '@entropy/index';
import { fetchFormData } from '@mobile/forms-management/data/formById';
import { IFormsMap } from '@mobile/forms-management/data/interfaces/formById.interface';
import { DynamicForm } from '../components/DynamicForm/DynamicForm';
import styles from './Forms.module.css';
import { useIsFailedVisit } from '@shared/hooks/useQueryParams';
import { useVisitDetail } from '@mobile/visits/data/hooks';
interface RouteParams {
  activity_id: string;
  page_code: string;
  name_form: string;
  index: string;
}

export const FormsPage: React.FC = () => {
  const {
    activity_id,
    page_code,
    name_form,
    // index
  } = useParams<RouteParams>();
  const isFailedVisit = useIsFailedVisit();
  const name_form_decode = decodeURIComponent(name_form);
  const [formData, setFormData] = useState<IFormsMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  // ✅ Datos de la visita (incluye descriptions) y estado REVERT_ACT
  const { isRevertAct, data: visitDetail } = useVisitDetail({
    activity_id,
  });

  // ✅ initialValues solo para REVERT_ACT, usando descriptions como fuente
  const initialValues = useMemo(() => {
    if (!isRevertAct || !visitDetail) return undefined;

    const values: Record<string, string> = {};

    try {
      // visitDetail.descriptions: IDescription[]
      visitDetail.descriptions?.forEach((section) => {
        section.fields?.forEach((field) => {
          const selected =
            field.selected_value && field.selected_value.length > 0
              ? field.selected_value[0]
              : '';

          if (selected !== undefined && selected !== null) {
            values[field.code] = String(selected);
          }
        });
      });
    } catch (e) {
      // En caso de shape inesperado, no romper el flujo
      return undefined;
    }

    return Object.keys(values).length > 0 ? values : undefined;
  }, [isRevertAct, visitDetail]);

  // Ref para el formulario dinámico
  const formRef = useRef<{ submit: () => void; resetLoading: () => void }>(
    null
  );

  // Hook del store para guardar datos
  // const { saveFormSubmission } = useFormsDataStore();

  useEffect(() => {
    getFormData();
  }, []);

  const getFormData = async () => {
    if (activity_id && page_code) {
      setIsLoading(true);
      fetchFormData(
        activity_id,
        page_code,
        isFailedVisit === 'true' ? 'failed' : 'normal'
      )
        .then((data) => {
          setFormData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error caught in getFormData:', err);
          setIsLoading(false);
        });
    }
  };

  const handleSubmit = async () => {
    // ✅ ARREGLO: No duplicar el guardado - DynamicForm ya guardó con isComplete: true
    // El formulario ya se guardó en DynamicForm con el estado correcto de isComplete

    if (activity_id && page_code) {
      try {
        // Resetear el loading del botón antes de navegar
        formRef.current?.resetLoading();
        history.go(-1);
        // navigateWithQueryParams(`/visit-managment/history/${activity_id}`);
      } catch (error) {
        console.error('Error en navegación:', error);
        // Resetear el loading del botón en caso de error
        formRef.current?.resetLoading();
        // Aún así continuar la navegación si hay error
        history.go(-1);
        // navigateWithQueryParams(`/visit-managment/history/${activity_id}`);
      }
    }
  };

  return (
    <IonPage id='main-content'>
      <Header
        text={name_form_decode}
        iconLeftType='regular'
        backButton
      />
      <IonContent className={styles.content}>
        {isLoading && <BiaLoader color='accent' />}

        {!isLoading && formData && (
          <DynamicForm
            ref={formRef}
            formData={formData.dataForms}
            onSubmit={handleSubmit}
            submitButtonText='Guardar y continuar'
            // Solo REVERT_ACT recibe initialValues; OTs normales siguen igual
            initialValues={initialValues}
          />
        )}
      </IonContent>
    </IonPage>
  );
};
