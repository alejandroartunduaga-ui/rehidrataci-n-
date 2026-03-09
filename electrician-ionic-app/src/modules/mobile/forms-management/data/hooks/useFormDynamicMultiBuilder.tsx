import { useState, useEffect } from 'react';
import {
  IFormData,
  IMappedFormsResponse,
  IPhotosAdd,
  ITransformer,
} from '@forms-management/data/interfaces/forms.interface';

export const useFormDynamicMultiBuilder = (dataForm: IFormData) => {
  const [dataForms, setDataForms] = useState<IMappedFormsResponse[]>([]);
  const [arrTransformers, setArrTransformers] = useState<ITransformer[][]>([]);
  const [photos, setPhotos] = useState<IPhotosAdd[]>([]);
  const [editActive, setEditActive] = useState<boolean>(false);
  const [openModalAdd, setOpenModalAdd] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [indexActive, setIndexActive] = useState<{
    builderIndex: number | null;
    transformerIndex: number | null;
  }>({ builderIndex: null, transformerIndex: null });

  useEffect(() => {
    if (dataForm.addInfo && dataForm.addInfo.length > 0) {
      setDataForms(dataForm.dataForms);
      initializeTransformers(dataForm.dataForms, dataForm.addInfo);
    } else {
      setDataForms(dataForm.dataForms);
      initializeTransformers(dataForm.dataForms);
    }

    setPhotos(dataForm.photos || []);
  }, [dataForm]);

  const initializeTransformers = (
    forms: IMappedFormsResponse[],
    addInfo?: ITransformer[]
  ) => {
    const builderForms = forms.filter((form) => form.type === 'BUILDER');

    if (!addInfo || addInfo.length === 0) {
      const emptyTransformers = builderForms.map(() => []);
      setArrTransformers(emptyTransformers);
      return;
    }

    const groupedByWidgetCode: { [widgetCode: string]: ITransformer[] } = {};
    addInfo.forEach((transformer) => {
      const firstItemWithCode = transformer.items?.find(
        (item) => item.widget_code
      );
      const widgetCode = firstItemWithCode?.widget_code;

      if (widgetCode) {
        if (!groupedByWidgetCode[widgetCode]) {
          groupedByWidgetCode[widgetCode] = [];
        }
        groupedByWidgetCode[widgetCode].push(transformer);
      } else {
        console.warn(
          'Transformer cannot be grouped: No item found with widget_code within:',
          transformer
        );
      }
    });

    const finalTransformers = builderForms.map((builderForm) => {
      const widgetCode = builderForm.code;
      return groupedByWidgetCode[widgetCode] || [];
    });

    setArrTransformers(finalTransformers);
  };

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

  const handleModal = (builderIndex: number, transformerIndex: number) => {
    setIndexActive({ builderIndex, transformerIndex });
    setOpenModal(true);
  };

  const handleModalAdd = (builderIndex: number) => {
    setIndexActive({ builderIndex, transformerIndex: null });
    setEditActive(false);
    setOpenModalAdd(true);
  };

  const handleEdit = () => {
    setEditActive(true);
    setOpenModal(false);
    setOpenModalAdd(true);
  };

  const deleteTransformer = () => {
    const getIndexTransformer = (index: number) => {
      return dataForms
        .slice(0, index ?? undefined)
        .filter((form) => form.type === 'BUILDER').length;
    };

    if (
      indexActive.builderIndex !== null &&
      indexActive.transformerIndex !== null
    ) {
      const updatedTransformers = [...arrTransformers];
      updatedTransformers[getIndexTransformer(indexActive.builderIndex)] =
        updatedTransformers[
          getIndexTransformer(indexActive.builderIndex)
        ].filter((_, idx) => idx !== indexActive.transformerIndex);
      setArrTransformers(updatedTransformers);
      setIndexActive({ builderIndex: null, transformerIndex: null });
    }
    setOpenModal(false);
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
