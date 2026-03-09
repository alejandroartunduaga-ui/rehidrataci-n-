import { useState, useEffect } from 'react';
import {
  IFormData,
  IMappedFormsResponse,
  IPhotosAdd,
  ITransformer,
} from '@forms-management/data/interfaces/forms.interface';

export const useFormDynamic = (
  dataForm: IFormData,
  activity_id: string,
  page_code: string
) => {
  const [dataForms, setDataForms] = useState<IMappedFormsResponse[]>(
    dataForm.dataForms || []
  );
  // Para arrTransformers, necesitamos considerar la estructura de addInfo vs builderItems.
  // Por ahora, inicialicemos con addInfo si existe, o vacío.
  const [arrTransformers, setArrTransformers] = useState<ITransformer[]>(
    dataForm.addInfo || []
  );
  const [photos, setPhotos] = useState<IPhotosAdd[]>(dataForm.photos || []);
  const [editActive, setEditActive] = useState<boolean>(false);
  const [openModalAdd, setOpenModalAdd] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [indexActive, setIndexActive] = useState<number | null>(null);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  useEffect(() => {
    // Solo intentar cargar si tenemos activity_id y page_code
    if (!activity_id || !page_code) {
      setIsLoadedFromStorage(false); // Marcar que no se intentó/pudo cargar
      return;
    }

    const attemptMade = false; // Para asegurar que setIsLoadedFromStorage se llame una vez por intento

    /* const loadData = async () => {
      try {
        // const storedDataString = await storageManager.getItem(tempStorageKey);
        if (storedDataString) {
          const parsedData: ITempStorageData = JSON.parse(storedDataString);

          setDataForms(parsedData.dataForms || dataForm.dataForms || []);
          setPhotos(parsedData.photos || dataForm.photos || []);

          if (parsedData.builderItems) {
            // Convertir builderItems (Record<string, ITransformer[]>) a arrTransformers (ITransformer[])
            const flatTransformers = Object.values(
              parsedData.builderItems
            ).flat();
            setArrTransformers(flatTransformers);
          } else {
            // Si no hay builderItems en storage, usar addInfo de props si existe
            setArrTransformers(dataForm.addInfo || []);
          }
          setIsLoadedFromStorage(true); // ¡Éxito! Datos cargados.
          attemptMade = true;
        } else {
          setIsLoadedFromStorage(false); // No hay datos, no se cargó nada.
          attemptMade = true;
        }
      } catch (error) {
        console.error(
          '[useFormDynamic] Error loading or parsing from temp storage:',
          error
        );
        setIsLoadedFromStorage(false); // Error, no se cargó.
        attemptMade = true;
      }
    }; */

    /* loadData(); */

    // Cleanup si el componente se desmonta antes de que loadData termine (raro pero posible)
    return () => {
      if (!attemptMade) {
        // Si loadData nunca llegó al final (setIsLoadedFromStorage), lo forzamos aquí
        // para evitar estados inconsistentes si el componente se desmonta muy rápido.
        // Considera si es mejor no hacer nada o forzar un estado. Por ahora, no hacer nada.
      }
    };
  }, [activity_id, page_code, dataForm]); // Incluir dataForm para que si cambia *después* del montaje inicial
  // y no se cargó nada del storage, se pueda re-evaluar.
  // Esto es sutil: si dataForm llega tarde asincrónicamente.

  useEffect(() => {
    // Si los datos ya fueron cargados desde el storage, no reinicializar desde dataForm,
    // a menos que dataForm represente una actualización intencional más nueva.
    // Por simplicidad, si se cargó del storage, asumimos que esos datos son los correctos por ahora.
    if (isLoadedFromStorage) {
      return;
    }

    // Si no se cargó del storage (isLoadedFromStorage es false),
    // entonces procedemos con la lógica original de inicialización basada en dataForm.
    setDataForms(dataForm.dataForms || []);
    setPhotos(dataForm.photos || []);

    if (dataForm.addInfo && dataForm.addInfo.length > 0) {
      setArrTransformers(dataForm.addInfo);
    } else {
      // Solo llamar a initializeTransformers si dataForms está realmente disponible.
      if (dataForm.dataForms && dataForm.dataForms.length > 0) {
        initializeTransformersFromDataForms(dataForm.dataForms);
      } else {
        setArrTransformers([]); // Si no hay addInfo ni dataForms, iniciar vacío.
      }
    }
  }, [dataForm, isLoadedFromStorage]); // Ahora depende de isLoadedFromStorage también.

  const handleInputChange = (
    formIndex: number,
    fieldIndex: number,
    value: string
  ) => {
    const updatedForms = dataForms.map((form, i) => ({
      ...form,
      fields: form.fields.map((field, j) => ({
        ...field,
        selected_value:
          i === formIndex && j === fieldIndex ? value : field.selected_value,
      })),
    }));
    setDataForms(updatedForms);
  };

  const handleModal = (index: number) => {
    setIndexActive(index);
    setOpenModal(true);
  };

  const handleModalAdd = () => {
    setEditActive(false);
    setOpenModalAdd(true);
  };

  const handleEdit = () => {
    setEditActive(true);
    setOpenModal(false);
    setOpenModalAdd(true);
  };

  const deleteTransformer = () => {
    if (indexActive !== null) {
      setArrTransformers((prev) =>
        prev.filter((_, idx) => idx !== indexActive)
      );
      setIndexActive(null);
    }
    setOpenModal(false);
  };

  const initializeTransformersFromDataForms = (
    forms: IMappedFormsResponse[]
  ) => {
    if (!forms || forms.length === 0) {
      setArrTransformers([]);
      return;
    }
    const transformers = forms.reduce<ITransformer[]>((acc, currentForm) => {
      if (currentForm.built_widgets && currentForm.built_widgets.length > 0) {
        // Suponiendo que built_widgets es ITransformer[] o compatible
        // La estructura original era más compleja, esto es una simplificación.
        // Si built_widgets es [{ widget_code, fields: [{field_code, values}] }]
        // y ITransformer es { widget_code, items: [{code, name, value}] }
        // Se necesita una transformación más detallada aquí.
        // Por ahora, si built_widgets está y es un array, lo usamos.
        // Esto asume que dataForm.built_widgets ya tiene la estructura de ITransformer[]
        // si es que viene de built_widgets. La data original mostraba built_widgets
        // como un array de arrays de objetos con field_code y values.
        // Esto necesita un mapeo cuidadoso.

        // Ejemplo de mapeo (SI built_widgets es Array de [{field_code, values}] por cada widget):
        const formTransformers: ITransformer[] = currentForm.built_widgets.map(
          (widgetArray) => {
            // Suponiendo que cada widgetArray es para un ITransformer
            // y widgetArray es [{field_code, values}]
            return {
              widget_code: currentForm.code, // o el widget_code específico si está en widgetArray
              items: widgetArray.map((bw) => ({
                code: bw.field_code,
                name: '', // El nombre no está en built_widget
                value: bw.values[0],
              })),
            };
          }
        );
        acc.push(...formTransformers);
      }
      return acc;
    }, []);
    setArrTransformers(transformers);
  };

  return {
    dataForms,
    arrTransformers,
    photos,
    openModal,
    openModalAdd,
    editActive,
    indexActive,
    handleInputChange,
    handleModal,
    handleEdit,
    deleteTransformer,
    setOpenModalAdd,
    setOpenModal,
    setPhotos,
    setArrTransformers,
    handleModalAdd,
    setEditActive,
    setDataForms,
  };
};
