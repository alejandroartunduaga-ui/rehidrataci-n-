import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { BiaLoader, Header } from '@entropy/index';
import { fetchFormData } from '@mobile/forms-management/data/formById';
import { IFormsMap } from '@mobile/forms-management/data/interfaces/formById.interface';
import {
  IPhotosAdd,
  ITransformer,
} from '@mobile/forms-management/data/interfaces/forms.interface';
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

type BuiltWidgetRow = {
  widget_code?: string | null;
  fields?: Array<{ field_code?: string; name?: string; value?: string; selected_value?: string[] }>;
};

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

  // ✅ initialValues solo para REVERT_ACT: mapa por code y name para resolver mismatch backend (code=UUID) vs form (code=codigo_bia)
  const initialValues = useMemo(() => {
    if (!isRevertAct || !visitDetail || !formData) return undefined;

    const values: Record<string, string> = {};

    try {
      // 1. Mapa con ambas keys (code y name) desde descriptions para matchear aunque backend use UUID y form use nombre lógico
      const descriptionsMap = new Map<string, string>();

      visitDetail.descriptions?.forEach((section) => {
        section.fields?.forEach((field) => {
          const selected =
            field.selected_value && field.selected_value.length > 0
              ? field.selected_value[0]
              : '';
          const str = String(selected ?? '');
          if (field.code) descriptionsMap.set(field.code, str);
          if (field.name && field.name !== field.code) descriptionsMap.set(field.name, str);
        });
        const sectionAny = section as { built_widgets?: Array<{ fields?: Array<{ code?: string; name?: string; selected_value?: string[] }> }> };
        sectionAny.built_widgets?.forEach((bw) => {
          bw.fields?.forEach((f) => {
            const sel = f.selected_value?.[0] ?? '';
            const str = String(sel);
            if (f.code) descriptionsMap.set(f.code, str);
            if (f.name && f.name !== f.code) descriptionsMap.set(f.name, str);
          });
        });
      });

      // 2. Llenar values con la key del form: intentar code primero, luego name
      formData.dataForms?.forEach((form) => {
        form.fields?.forEach((field) => {
          const val = descriptionsMap.get(field.code) ?? descriptionsMap.get(field.name);
          if (val !== undefined) values[field.code] = val;
        });
        form.built_widgets?.forEach((bw) => {
          bw.fields?.forEach((field) => {
            const val = descriptionsMap.get(field.code) ?? descriptionsMap.get(field.name);
            if (val !== undefined) values[field.code] = val;
          });
        });
      });

      return Object.keys(values).length > 0 ? values : undefined;
    } catch (e) {
      return undefined;
    }
  }, [isRevertAct, visitDetail, formData]);

  // Fase 2: fotos desde visitDetail.photos, section.photos o fields type FILE con data[].url
  const initialPhotos = useMemo((): IPhotosAdd[] | undefined => {
    if (!isRevertAct || !visitDetail || !formData) return undefined;
    try {
      const v = visitDetail as {
        photos?: IPhotosAdd[];
        descriptions?: Array<{ photos?: IPhotosAdd[]; fields?: Array<{ code?: string; name?: string; type?: string; input_type?: string; data?: Array<{ url?: string; name?: string }> }> }>;
      };
      const list: IPhotosAdd[] = [];

      // Origen 1: raíz o por sección (comportamiento actual)
      const fromRoot = Array.isArray(v.photos) ? v.photos : [];
      const fromSections = v.descriptions?.flatMap((s) => (s as { photos?: IPhotosAdd[] }).photos ?? []) ?? [];
      [...fromRoot, ...fromSections].forEach((p) => {
        list.push({
          url: p.url ?? '',
          name: p.name ?? '',
          code: p.code ?? '',
          ...(p.displayUrl && { displayUrl: p.displayUrl }),
          ...(p.blob && { blob: p.blob }),
        });
      });

      // Origen 2: fields type FILE con data[].url; usar code del form para que DynamicForm agrupe bien
      const formFileFields: { code: string; name: string }[] = [];
      formData.dataForms?.forEach((form) => {
        form.fields?.forEach((field) => {
          if (field.type === 'FILE' || field.input_type === 'FILE') {
            formFileFields.push({ code: field.code, name: field.name ?? '' });
          }
        });
      });

      v.descriptions?.forEach((section) => {
        section.fields?.forEach((field) => {
          if (field.type !== 'FILE' && field.input_type !== 'FILE') return;
          const dataArr = field.data;
          if (!Array.isArray(dataArr) || dataArr.length === 0) return;
          const match = formFileFields.find(
            (ff) => ff.code === field.code || ff.code === field.name || ff.name === field.code || ff.name === field.name
          );
          const formCode = match?.code ?? field.code ?? field.name ?? 'file';
          dataArr.forEach((item: { url?: string; name?: string }, idx: number) => {
            const url = item?.url ?? (typeof item === 'string' ? item : '');
            if (!url) return;
            list.push({
              url,
              name: item?.name ?? field.name ?? field.code ?? `photo_${idx}`,
              code: formCode,
            });
          });
        });
      });

      return list.length > 0 ? list : undefined;
    } catch {
      return undefined;
    }
  }, [isRevertAct, visitDetail, formData]);

  const initialBuilderItems = useMemo((): ITransformer[] | undefined => {
    if (!isRevertAct || !visitDetail || !formData) return undefined;
    try {
      const v = visitDetail as { built_widgets?: BuiltWidgetRow[]; descriptions?: Array<{ built_widgets?: BuiltWidgetRow[] }> };
      const widgetCodesInForm = new Set<string>();
      formData.dataForms?.forEach((form) => {
        form.built_widgets?.forEach((bw) => {
          if (bw.widget_code) widgetCodesInForm.add(bw.widget_code);
        });
      });
      const fromRoot = Array.isArray(v.built_widgets) ? v.built_widgets : [];
      const fromSections =
        v.descriptions?.flatMap((s: { built_widgets?: BuiltWidgetRow[] }) => s.built_widgets ?? []) ?? [];
      const allWidgets = fromRoot.length ? fromRoot : fromSections;
      const out: ITransformer[] = [];
      allWidgets.forEach((bw: BuiltWidgetRow) => {
        const wc = bw.widget_code ?? null;
        if (!wc || !widgetCodesInForm.has(wc)) return;
        const fields = bw.fields ?? [];
        if (fields.length === 0) return;
        const items = fields.map((f: { field_code?: string; name?: string; value?: string; selected_value?: string[] }) => ({
          code: f.field_code ?? '',
          name: f.name ?? '',
          value: (f.value ?? f.selected_value?.[0] ?? '') as string,
          widget_code: wc,
        }));
        out.push({ widget_code: wc, items });
      });
      return out.length > 0 ? out : undefined;
    } catch {
      return undefined;
    }
  }, [isRevertAct, visitDetail, formData]);

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
            initialValues={initialValues}
            initialPhotos={initialPhotos}
            initialBuilderItems={initialBuilderItems}
          />
        )}
      </IonContent>
    </IonPage>
  );
};
