import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useIonRouter } from '@ionic/react';
import {
  BiaText,
  BiaDropdown,
  BiaTextArea,
  BiaIcon,
  BiaToast,
  BiaLoader,
} from '@entropy/index';
import {
  IGeneralBorderInformation,
  ITechnicalInformation,
  IOTInfo,
  ICGMInfo,
  IScopeDefinition,
  ISku,
} from '@hv/scopes/data/interfaces/detailScopes.interface';
import { TranslationNamespaces } from '@shared/i18n';
import { useDetailScope } from '@hv/scopes/data/hooks/useDetailScope';
import { ModalConfirmScope } from '../ModalConfirmScope/ModalConfirmScope';
import styles from './GeneralInfoScope.module.css';

interface GeneralInfoScopeProps {
  generalInfo: IGeneralBorderInformation;
  technicalInfo: ITechnicalInformation;
  otInfo: IOTInfo;
  cgmInfo: ICGMInfo;
  scopeDefinition?: IScopeDefinition;
  biaCode?: string;
  scopeId: string;
}

export const GeneralInfoScope = ({
  generalInfo,
  technicalInfo,
  otInfo,
  cgmInfo,
  scopeDefinition,
  biaCode,
  scopeId,
}: GeneralInfoScopeProps) => {
  const { t } = useTranslation(TranslationNamespaces.SCOPES);
  const router = useIonRouter();
  const { getSkusMutation, saveScopeDefinitionMutation } = useDetailScope();

  const [typeService, setTypeService] = useState(
    scopeDefinition?.type_service || ''
  );
  const [requiresNetworkOperator, setRequiresNetworkOperator] = useState(
    scopeDefinition?.requires_network_operator_support || false
  );
  const [scopeDescription, setScopeDescription] = useState(
    scopeDefinition?.scope_description || ''
  );
  const [requiresKit, setRequiresKit] = useState(
    scopeDefinition?.requires_kit || false
  );
  const [requiresAdditionalEquipment, setRequiresAdditionalEquipment] =
    useState(scopeDefinition?.requires_additional_equipment || false);
  const [skuList, setSkuList] = useState(scopeDefinition?.sku_ids || []);
  const [availableSkus, setAvailableSkus] = useState<ISku[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isModalOpenConfirmScope, setIsModalOpenConfirmScope] = useState(false);

  const serviceTypeOptions = [
    {
      label: t(
        'detail.scope_definition_form.type_service_options.telemetry_normalization'
      ),
      value: 'NORMALIZACION_TELEMEDIDA',
    },
    {
      label: t(
        'detail.scope_definition_form.type_service_options.emergency_normalization'
      ),
      value: 'NORMALIZACION_EMERGENCIA',
    },
  ];

  // Prellenar campos según condiciones específicas
  useEffect(() => {
    // Solo aplicar si no hay descripción previa
    if (scopeDefinition?.scope_description) return;

    // Función helper para normalizar strings (sin tildes y en minúsculas)
    const normalizeString = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const hasLowSuccessRate =
      otInfo.total_successful_telemetry_work_orders === 0 ||
      otInfo.total_successful_telemetry_work_orders === 1;

    const hasTwoSuccesses = otInfo.total_successful_telemetry_work_orders === 2;

    const normalizedMeterBrand = normalizeString(
      technicalInfo.current_meter_brand
    );
    const normalizedFailureCause = normalizeString(cgmInfo.failure_cause);

    const isMicrostarOrOther =
      normalizedMeterBrand === normalizeString('MICROSTAR') ||
      normalizedMeterBrand === normalizeString('OTRAS MARCAS');

    // Caso 1: Sin señal (0 o 1 éxitos)
    const isNoSignal =
      hasLowSuccessRate &&
      isMicrostarOrOther &&
      normalizedFailureCause === normalizeString('Sin señal');

    // Caso 2: Modem intermitente
    const isIntermittentModem =
      hasLowSuccessRate &&
      normalizedFailureCause === normalizeString('Modem intermitente') &&
      isMicrostarOrOther;

    // Caso 3: Sin señal con 2 éxitos
    const isNoSignalTwoSuccesses =
      hasTwoSuccesses &&
      normalizedFailureCause === normalizeString('Sin señal') &&
      isMicrostarOrOther;

    // Caso 4: Modem intermitente con 2 éxitos y MICROSTAR
    const isIntermittentModemTwoSuccessesMicrostar =
      hasTwoSuccesses &&
      normalizedFailureCause === normalizeString('Modem intermitente') &&
      normalizedMeterBrand === normalizeString('MICROSTAR');

    // Caso 5: Modem intermitente con 2 éxitos y OTRAS MARCAS
    const isIntermittentModemTwoSuccessesOther =
      hasTwoSuccesses &&
      normalizedFailureCause === normalizeString('Modem intermitente') &&
      normalizedMeterBrand === normalizeString('OTRAS MARCAS');

    // Caso 6: Sin señal con 3 o más éxitos
    const isNoSignalThreeOrMoreSuccesses =
      otInfo.total_successful_telemetry_work_orders >= 3 &&
      normalizedFailureCause === normalizeString('Sin señal') &&
      isMicrostarOrOther;

    // Caso 7: Modem intermitente con 3 o más éxitos y MICROSTAR
    const isIntermittentModemThreeOrMoreSuccessesMicrostar =
      otInfo.total_successful_telemetry_work_orders >= 3 &&
      normalizedFailureCause === normalizeString('Modem intermitente') &&
      normalizedMeterBrand === normalizeString('MICROSTAR');

    // Caso 8: Modem intermitente con 3 o más éxitos y OTRAS MARCAS
    const isIntermittentModemThreeOrMoreSuccessesOther =
      otInfo.total_successful_telemetry_work_orders >= 3 &&
      normalizedFailureCause === normalizeString('Modem intermitente') &&
      normalizedMeterBrand === normalizeString('OTRAS MARCAS');

    if (isNoSignal) {
      const autofillText =
        'Realizar reinicio de modem existente, si el modem vuelve a enganchar verificar con personal de CGM  si la reubicacion de la antena mejora la señal de datos, sino verificar si con antena de alta ganancia mejora, si la señal persiste baja confirmar el operador de red movil con mejor cobertura.\n\nSi no tiene el kit para normalizar telemedida compuesto por modem, sim cards de diferentes operadores, antena de alta ganancia, splitter y dispositivo de reinicio. Por favor no aceptar la OT de trabajo.';

      setTypeService('NORMALIZACION_TELEMEDIDA');
      setScopeDescription(autofillText);
      setRequiresKit(true);
      setRequiresAdditionalEquipment(false);
    } else if (isIntermittentModem) {
      const autofillText =
        'Realizar  instalación de dispositivo de reset ya que el modem actual es intermitente.\n\nSi no tiene el kit para normalizar telemedida compuesto por modem, sim cards de diferentes operadores, antena de alta ganancia, splitter y dispositivo de reinicio. Por favor no aceptar OT de trabajo.';

      setTypeService('NORMALIZACION_TELEMEDIDA');
      setScopeDescription(autofillText);
      setRequiresKit(true);
      setRequiresAdditionalEquipment(false);
    } else if (isNoSignalTwoSuccesses) {
      const autofillText =
        'Realizar pruebas para instalar SIM del  el operador movil con mas señal en el punto, instalar antena de alta ganancia y validar la instalacion de una extension se es necesario, esto lo confirma con el nivel de señal que muestre el  modem o con el personal de CGM\n\nSi no tiene el kit para normalizar telemedida compuesto por modem, sim cards de diferentes operadores, antena de alta ganancia, splitter y dispositivo de reinicio. Por favor no aceptar la OT de trabajo.';

      setTypeService('NORMALIZACION_TELEMEDIDA');
      setScopeDescription(autofillText);
      setRequiresKit(true);
      setRequiresAdditionalEquipment(false);
    } else if (isIntermittentModemTwoSuccessesMicrostar) {
      const autofillText =
        'Realizar cambio de modem e instalacion de dispositivo de reset ya que el modem actual es intermitente\n\nSi no tiene el kit para normalizar telemedida compuesto por modem, sim cards de diferentes operadores, antena de alta ganancia, splitter y dispositivo de reinicio. Por favor no aceptar la OT de trabajo.';

      setTypeService('NORMALIZACION_TELEMEDIDA');
      setScopeDescription(autofillText);
      setRequiresKit(true);
      setRequiresAdditionalEquipment(false);
    } else if (isIntermittentModemTwoSuccessesOther) {
      const autofillText =
        'Realizar cambio de modem e instalacion de dispositivo de reset ya que el modem actual es intermitente\n\nSi no tiene el kit para normalizar telemedida compuesto por modem, sim cards de diferentes operadores, antena de alta ganancia, splitter y dispositivo de reinicio. Por favor no aceptar la OT de trabajo.';

      setTypeService('NORMALIZACION_TELEMEDIDA');
      setScopeDescription(autofillText);
      setRequiresKit(false);
      setRequiresAdditionalEquipment(true);
    } else if (isNoSignalThreeOrMoreSuccesses) {
      const autofillText =
        'Si ya la la medida cuenta con antena de alta ganancia y extension realizar instalacion de amplificador de señal movil 3G-4G el cual requiere alimentacion a 120 V  si actualmente la medida no tiene toma entonce para esto es necesario contar con un toma doble con tapa, caja 2x4 pvc, tornilleria autoperforante, cable #12 cobre\n\nSi no tiene el kit para normalizar telemedida compuesto por modem, sim cards de diferentes operadores, antena de alta ganancia, splitter y dispositivo de reinicio. Por favor no aceptar la OT de trabajo.';

      setTypeService('NORMALIZACION_TELEMEDIDA');
      setScopeDescription(autofillText);
      setRequiresKit(true);
      setRequiresAdditionalEquipment(false);
    } else if (isIntermittentModemThreeOrMoreSuccessesMicrostar) {
      const autofillText =
        'Confirmar con CGM si es necesario el cambio de operador móvil\n\nVerificar cobertura, estabilidad y compatibilidad del operador actual con el medidor instalado.\n\nInstalar módem de otra marca  compatible con el medidor previamente configurado\n\nAsegurar que el módem esté homologado y que la configuración (APN, banda, protocolo) esté alineada con el sistema de medición.\n\nVerificar nivel de señal con equipo CGM\n\nUtilizar herramientas de diagnóstico para medir RSSI, RSRP, SINR u otros parámetros relevantes según la tecnología (GPRS, LTE, NB-IoT).\n\nInstalar antena de alta ganancia si es necesario\n\nEn caso de señal débil o inestable, incorporar antena externa direccional u omnidireccional compatible con el módem.\n\nSi no tiene el kit para normalizar telemedida compuesto por modem, sim cards de diferentes operadores, antena de alta ganancia, splitter y dispositivo de reinicio. Por favor no aceptar la OT de trabajo.';

      setTypeService('NORMALIZACION_TELEMEDIDA');
      setScopeDescription(autofillText);
      setRequiresKit(false);
      setRequiresAdditionalEquipment(true);
    } else if (isIntermittentModemThreeOrMoreSuccessesOther) {
      const autofillText =
        'Confirmar con CGM si es necesario el cambio de operador móvil\n\nVerificar cobertura, estabilidad y compatibilidad del operador actual con el medidor instalado.\n\nInstalar módem de otra marca  compatible con el medidor previamente configurado\n\nAsegurar que el módem esté homologado y que la configuración (APN, banda, protocolo) esté alineada con el sistema de medición.\n\nVerificar nivel de señal con equipo CGM\n\nUtilizar herramientas de diagnóstico para medir RSSI, RSRP, SINR u otros parámetros relevantes según la tecnología (GPRS, LTE, NB-IoT).\n\nInstalar antena de alta ganancia si es necesario\n\nEn caso de señal débil o inestable, incorporar antena externa direccional u omnidireccional compatible con el módem.\n\nSi no tiene el kit para normalizar telemedida compuesto por modem, sim cards de diferentes operadores, antena de alta ganancia, splitter y dispositivo de reinicio. Por favor no aceptar la OT de trabajo.';

      setTypeService('NORMALIZACION_TELEMEDIDA');
      setScopeDescription(autofillText);
      setRequiresKit(false);
      setRequiresAdditionalEquipment(true);
    }
  }, [
    otInfo.total_successful_telemetry_work_orders,
    technicalInfo.current_meter_brand,
    cgmInfo.failure_cause,
    scopeDefinition?.scope_description,
  ]);

  // Cargar SKUs al iniciar el componente
  useEffect(() => {
    if (Array.isArray(availableSkus) && availableSkus.length === 0) {
      getSkusMutation.mutate(undefined, {
        onSuccess: (data) => {
          if (data) {
            setAvailableSkus(data);
          }
          getSkusMutation.reset();
        },
        onError: () => {
          getSkusMutation.reset();
        },
      });
    }
  }, []); // Solo al montar el componente

  // Manejar lógica cuando cambia "Requiere equipos adicionales"
  useEffect(() => {
    if (requiresAdditionalEquipment) {
      // Si no hay SKUs en la lista, agregar uno vacío o preseleccionar según el caso
      if (skuList.length === 0 && availableSkus.length > 0) {
        // Función helper para normalizar strings
        const normalizeString = (str: string): string => {
          return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        };

        const normalizedMeterBrand = normalizeString(
          technicalInfo.current_meter_brand
        );
        const normalizedFailureCause = normalizeString(cgmInfo.failure_cause);

        // Verificar si estamos en el caso 5, 7 u 8: preseleccionar SKU 384
        const isCase5 =
          otInfo.total_successful_telemetry_work_orders === 2 &&
          normalizedFailureCause === normalizeString('Modem intermitente') &&
          normalizedMeterBrand === normalizeString('OTRAS MARCAS');

        const isCase7 =
          otInfo.total_successful_telemetry_work_orders >= 3 &&
          normalizedFailureCause === normalizeString('Modem intermitente') &&
          normalizedMeterBrand === normalizeString('MICROSTAR');

        const isCase8 =
          otInfo.total_successful_telemetry_work_orders >= 3 &&
          normalizedFailureCause === normalizeString('Modem intermitente') &&
          normalizedMeterBrand === normalizeString('OTRAS MARCAS');

        if (isCase5 || isCase7 || isCase8) {
          const sku384 = availableSkus.find((sku: ISku) => sku.id === 384);
          if (sku384) {
            setSkuList([{ name: sku384.name, quantity: 1, sku_id: 384 }]);
          } else {
            setSkuList([{ name: '', quantity: 0, sku_id: 0 }]);
          }
        } else {
          setSkuList([{ name: '', quantity: 0, sku_id: 0 }]);
        }
      }
    } else {
      // Si se desmarca, limpiar la lista de SKUs
      setSkuList([]);
    }
  }, [requiresAdditionalEquipment, availableSkus]);

  const addSku = () => {
    setSkuList([...skuList, { name: '', quantity: 0, sku_id: 0 }]);
  };

  const removeSku = (index: number) => {
    setSkuList(skuList.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await saveScopeDefinitionMutation.mutateAsync({
        scope_id: scopeId,
        type_service: typeService,
        requires_network_operator_support: requiresNetworkOperator,
        scope_description: scopeDescription,
        requires_kit: requiresKit,
        requires_additional_equipment: requiresAdditionalEquipment,
        sku_ids: requiresAdditionalEquipment ? skuList : [],
      });

      setToast({
        message: t('detail.scope_definition_form.success_message'),
        type: 'success',
      });

      setTimeout(() => {
        router.push('/admin-regulatory/scopes', 'back', 'pop');
      }, 1500);
    } catch (error) {
      console.error('Error saving scope definition:', error);
      setToast({
        message: t('detail.scope_definition_form.error_message'),
        type: 'error',
      });
    }
  };

  const renderInfoItem = (label: string, value: string | number) => (
    <div className={styles.infoItem}>
      <BiaText
        token='bodyRegular'
        color='standardOn'
        className={styles.label}
      >
        {label}
      </BiaText>
      <BiaText
        token='bodyRegular'
        color='weak'
        className={styles.value}
      >
        {value || '-'}
      </BiaText>
    </div>
  );

  return (
    <>
      {toast && (
        <BiaToast
          message={toast.message}
          theme={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {(saveScopeDefinitionMutation.isPending || getSkusMutation.isPending) && (
        <BiaLoader color='accent' />
      )}
      {/* Información general de la frontera */}
      <div className={styles.section}>
        <BiaText
          token='heading-3'
          color='accent'
          className={styles.sectionTitle}
        >
          {t('detail.sections.general_info')}
        </BiaText>
        <div className={styles.infoGrid}>
          {renderInfoItem(
            t('detail.general_info_fields.contract_id'),
            generalInfo.contract_id
          )}
          {renderInfoItem(
            t('detail.general_info_fields.bia_code'),
            biaCode || '-'
          )}
          {renderInfoItem(
            t('detail.general_info_fields.sic_code'),
            generalInfo.sic
          )}
          {renderInfoItem(
            t('detail.general_info_fields.border_name'),
            generalInfo.border_name
          )}
          {renderInfoItem(
            t('detail.general_info_fields.monthly_consumption'),
            generalInfo.monthly_consumption_kwh.toString()
          )}
          {renderInfoItem(
            t('detail.general_info_fields.network_operator'),
            generalInfo.network_operator
          )}
          {renderInfoItem(
            t('detail.general_info_fields.department'),
            generalInfo.department
          )}
          {renderInfoItem(
            t('detail.general_info_fields.city'),
            generalInfo.city
          )}
          {renderInfoItem(
            t('detail.general_info_fields.address'),
            generalInfo.address
          )}
        </div>
      </div>

      {/* Información técnica de la frontera */}
      <div className={styles.section}>
        <BiaText
          token='heading-3'
          color='accent'
          className={styles.sectionTitle}
        >
          {t('detail.sections.technical_info')}
        </BiaText>
        <div className={styles.infoGrid}>
          {renderInfoItem(
            t('detail.technical_info_fields.measurement_type'),
            technicalInfo.measurement_type
          )}
          {renderInfoItem(
            t('detail.technical_info_fields.voltage_level'),
            technicalInfo.voltage_level
          )}
          {renderInfoItem(
            t('detail.technical_info_fields.measurement_factor'),
            technicalInfo.measurement_factor.toString()
          )}
          {renderInfoItem(
            t('detail.technical_info_fields.meter_serial'),
            technicalInfo.meter_serial
          )}
          {renderInfoItem(
            t('detail.technical_info_fields.current_meter_brand'),
            technicalInfo.current_meter_brand
          )}
          {renderInfoItem(
            t('detail.technical_info_fields.current_ip'),
            technicalInfo.current_ip
          )}
          {renderInfoItem(
            t('detail.technical_info_fields.current_apn'),
            technicalInfo.current_apn
          )}
          {renderInfoItem(
            t('detail.technical_info_fields.ageing_without_tm'),
            technicalInfo.ageing_without_tm
          )}
        </div>
      </div>

      {/* Información de las OTs de la frontera */}
      <div className={styles.section}>
        <BiaText
          token='heading-3'
          color='accent'
          className={styles.sectionTitle}
        >
          {t('detail.sections.ot_info')}
        </BiaText>
        <div className={styles.infoGrid}>
          {renderInfoItem(
            t('detail.ot_info_fields.last_visit_service_type'),
            otInfo.last_visit_service_type
          )}
          {renderInfoItem(
            t('detail.ot_info_fields.total_telemetry_work_orders'),
            otInfo.total_telemetry_work_orders.toString()
          )}
          <div /> {/* Espacio vacío para mantener el grid */}
          {renderInfoItem(
            t('detail.ot_info_fields.last_visit_date'),
            otInfo.last_visit_date
          )}
          {renderInfoItem(
            t('detail.ot_info_fields.total_successful_telemetry'),
            otInfo.total_successful_telemetry_work_orders.toString()
          )}
          <div /> {/* Espacio vacío para mantener el grid */}
          {renderInfoItem(
            t('detail.ot_info_fields.last_visit_observation'),
            otInfo.last_visit_observation
          )}
          {renderInfoItem(
            t('detail.ot_info_fields.last_successful_observation'),
            otInfo.last_successful_telemetry_observation
          )}
        </div>
      </div>

      {/* Información de CGM */}
      <div className={styles.section}>
        <BiaText
          token='heading-3'
          color='accent'
          className={styles.sectionTitle}
        >
          {t('detail.sections.cgm_info')}
        </BiaText>
        <div className={styles.cgmGrid}>
          <div className={styles.cgmColumn}>
            {renderInfoItem(
              t('detail.cgm_info_fields.failure_cause'),
              cgmInfo.failure_cause
            )}
            {renderInfoItem(
              t('detail.cgm_info_fields.sustained_ip_test'),
              cgmInfo.sustained_ip_test15_seconds
            )}

            {cgmInfo.ip_test_image && (
              <div className={styles.imageContainer}>
                <BiaText
                  token='bodyRegular'
                  color='standardOn'
                  className={styles.label}
                >
                  {t('detail.cgm_info_fields.ip_test_image')}
                </BiaText>
                <img
                  src={cgmInfo.ip_test_image}
                  alt='Prueba de IP'
                  className={styles.image}
                />
              </div>
            )}

            {renderInfoItem(
              t('detail.cgm_info_fields.text_message_recovery_test'),
              cgmInfo.text_message_recovery_test
            )}

            {cgmInfo.recovery_test_image && (
              <div className={styles.imageContainer}>
                <BiaText
                  token='bodyRegular'
                  color='standardOn'
                  className={styles.label}
                >
                  {t('detail.cgm_info_fields.recovery_test_image')}
                </BiaText>
                <img
                  src={cgmInfo.recovery_test_image}
                  alt='Prueba de recuperación'
                  className={styles.image}
                />
              </div>
            )}
          </div>

          <div className={styles.cgmColumn}>
            {renderInfoItem(
              t('detail.cgm_info_fields.port_tests'),
              cgmInfo.port40005000_tests
            )}

            {cgmInfo.port_tests_image && (
              <div className={styles.imageContainer}>
                <BiaText
                  token='bodyRegular'
                  color='standardOn'
                  className={styles.label}
                >
                  {t('detail.cgm_info_fields.port_tests_image')}
                </BiaText>
                <img
                  src={cgmInfo.port_tests_image}
                  alt='Pruebas de puerto'
                  className={styles.image}
                />
              </div>
            )}

            {renderInfoItem(
              t('detail.cgm_info_fields.meter_telemetry_test'),
              cgmInfo.meter_telemetry_test
            )}
            {renderInfoItem(
              t('detail.cgm_info_fields.additional_observations'),
              cgmInfo.additional_observations
            )}
          </div>
        </div>
      </div>

      {/* Definición de alcance */}
      <div className={styles.section}>
        <BiaText
          token='heading-3'
          color='accent'
          className={styles.sectionTitle}
        >
          {t('detail.sections.scope_definition')}
        </BiaText>

        <div className={styles.formContainer}>
          {/* Tipo de servicio */}
          <div className={styles.formField}>
            <BiaText
              token='bodyRegular'
              color='standardOn'
              className={styles.formLabel}
            >
              {t('detail.scope_definition_form.type_service_label')}{' '}
              <span className={styles.required}>*</span>
            </BiaText>
            <div
              style={{
                pointerEvents: !scopeDefinition?.can_edit ? 'none' : 'auto',
                opacity: !scopeDefinition?.can_edit ? 0.5 : 1,
              }}
            >
              <BiaDropdown
                options={serviceTypeOptions}
                value={typeService}
                onChange={(val: string | string[]) =>
                  setTypeService(typeof val === 'string' ? val : val[0])
                }
                placeholder={t(
                  'detail.scope_definition_form.type_service_placeholder'
                )}
              />
            </div>
          </div>

          {/* Requiere acompañamiento de operador de red */}
          <div className={styles.formField}>
            <BiaText
              token='bodyRegular'
              color='standardOn'
              className={styles.formLabel}
            >
              {t('detail.scope_definition_form.requires_network_operator')}{' '}
              <span className={styles.required}>*</span>
            </BiaText>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type='radio'
                  checked={requiresNetworkOperator === true}
                  onChange={() => setRequiresNetworkOperator(true)}
                  disabled={!scopeDefinition?.can_edit}
                />
                <span>{t('detail.scope_definition_form.yes')}</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type='radio'
                  checked={requiresNetworkOperator === false}
                  onChange={() => setRequiresNetworkOperator(false)}
                  disabled={!scopeDefinition?.can_edit}
                />
                <span>{t('detail.scope_definition_form.no')}</span>
              </label>
            </div>
          </div>

          {/* Alcance */}
          <div className={styles.formField}>
            <BiaText
              token='bodyRegular'
              color='standardOn'
              className={styles.formLabel}
            >
              {t('detail.scope_definition_form.scope_description_label')}{' '}
              <span className={styles.required}>*</span>
            </BiaText>
            <BiaTextArea
              value={scopeDescription}
              onIonInput={(e) => setScopeDescription(e.detail.value || '')}
              placeholder={t(
                'detail.scope_definition_form.scope_description_placeholder'
              )}
              rows={4}
              disabled={!scopeDefinition?.can_edit}
            />
          </div>

          {/* Requiere kit */}
          <div className={styles.formField}>
            <BiaText
              token='bodyRegular'
              color='standardOn'
              className={styles.formLabel}
            >
              {t('detail.scope_definition_form.requires_kit')}{' '}
              <span className={styles.required}>*</span>
            </BiaText>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type='radio'
                  checked={requiresKit === true}
                  onChange={() => setRequiresKit(true)}
                  disabled={!scopeDefinition?.can_edit}
                />
                <span>{t('detail.scope_definition_form.yes')}</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type='radio'
                  checked={requiresKit === false}
                  onChange={() => setRequiresKit(false)}
                  disabled={!scopeDefinition?.can_edit}
                />
                <span>{t('detail.scope_definition_form.no')}</span>
              </label>
            </div>
          </div>

          {/* Requiere equipos adicionales */}
          <div className={styles.formField}>
            <BiaText
              token='bodyRegular'
              color='standardOn'
              className={styles.formLabel}
            >
              {t('detail.scope_definition_form.requires_additional_equipment')}{' '}
              <span className={styles.required}>*</span>
            </BiaText>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type='radio'
                  checked={requiresAdditionalEquipment === true}
                  onChange={() => setRequiresAdditionalEquipment(true)}
                  disabled={!scopeDefinition?.can_edit}
                />
                <span>{t('detail.scope_definition_form.yes')}</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type='radio'
                  checked={requiresAdditionalEquipment === false}
                  onChange={() => setRequiresAdditionalEquipment(false)}
                  disabled={!scopeDefinition?.can_edit}
                />
                <span>{t('detail.scope_definition_form.no')}</span>
              </label>
            </div>
          </div>

          {/* Seleccione los SKUs - Solo visible si requiere equipos adicionales */}
          {requiresAdditionalEquipment && (
            <div className={styles.formField}>
              <BiaText
                token='bodyRegular'
                color='standardOn'
                className={styles.formLabel}
              >
                {t('detail.scope_definition_form.select_skus')}{' '}
                <span className={styles.required}>*</span>
              </BiaText>

              {skuList.map((sku, index) => {
                return (
                  <div
                    key={index}
                    className={styles.skuRow}
                  >
                    <div className={styles.skuInputs}>
                      <div
                        style={{
                          pointerEvents: !scopeDefinition?.can_edit
                            ? 'none'
                            : 'auto',
                          opacity: !scopeDefinition?.can_edit ? 0.5 : 1,
                          flex: 1,
                        }}
                      >
                        <BiaDropdown
                          options={(availableSkus || []).map((s) => ({
                            label: s.name,
                            value: s.id.toString(),
                          }))}
                          searchable={true}
                          value={sku.sku_id.toString()}
                          onChange={(val: string | string[]) => {
                            const newSkuList = [...skuList];
                            const stringVal =
                              typeof val === 'string' ? val : val[0];
                            const selectedSku = (availableSkus || []).find(
                              (s) => s.id.toString() === stringVal
                            );
                            newSkuList[index].sku_id = parseInt(stringVal);
                            newSkuList[index].name = selectedSku?.name || '';
                            setSkuList(newSkuList);
                          }}
                          placeholder={t(
                            'detail.scope_definition_form.select_skus_placeholder'
                          )}
                        />
                      </div>
                      <input
                        type='number'
                        className={styles.quantityInput}
                        placeholder='0'
                        value={sku.quantity}
                        onChange={(e) => {
                          const newSkuList = [...skuList];
                          newSkuList[index].quantity =
                            parseInt(e.target.value) || 0;
                          setSkuList(newSkuList);
                        }}
                        disabled={!scopeDefinition?.can_edit}
                      />
                    </div>
                    {scopeDefinition?.can_edit && (
                      <button
                        className={styles.removeSkuButton}
                        onClick={() => removeSku(index)}
                        type='button'
                      >
                        <BiaIcon
                          iconName='faTrash'
                          iconType='regular'
                          size='16px'
                          color='error'
                        />
                      </button>
                    )}
                  </div>
                );
              })}

              {scopeDefinition?.can_edit && (
                <button
                  className={styles.addSkuButton}
                  onClick={addSku}
                  type='button'
                >
                  <BiaIcon
                    iconName='faPlus'
                    iconType='solid'
                    size='16px'
                    color='accent'
                  />
                  <span>{t('detail.scope_definition_form.add_sku')}</span>
                </button>
              )}
            </div>
          )}

          {/* Botón Finalizar alcance */}
          {scopeDefinition?.can_edit && (
            <div className={styles.formActions}>
              <button
                className={styles.submitButton}
                onClick={() => setIsModalOpenConfirmScope(true)}
                type='button'
                disabled={saveScopeDefinitionMutation.isPending}
              >
                {saveScopeDefinitionMutation.isPending
                  ? t('detail.scope_definition_form.saving')
                  : t('detail.scope_definition_form.finalize_scope')}
              </button>
            </div>
          )}
        </div>
      </div>

      <ModalConfirmScope
        isOpen={isModalOpenConfirmScope}
        onClose={() => setIsModalOpenConfirmScope(false)}
        onConfirm={() => {
          setIsModalOpenConfirmScope(false);
          handleSubmit();
        }}
      />
    </>
  );
};
