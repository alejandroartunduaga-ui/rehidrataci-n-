import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BiaDropdown,
  BiaText,
  BiaIcon,
  BiaLoader,
  BiaToast,
  BiaModalDesktop,
} from '@entropy/index';
import { IWorkOrder } from '@desktop/work-orders/data/interfaces/workOrders.interface';
import { IElectrician } from '@desktop/work-orders/data/interfaces/assingElectricians';
import { useVisitAsignment } from '@desktop/work-orders/data/hooks/useVisitAssignment';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './AssignElectriciansModal.module.css';

interface AssignElectriciansModalProps {
  workOrder: IWorkOrder;
  onClose: () => void;
  onReload: () => void;
  onError?: () => void;
}

export const AssignElectriciansModal: React.FC<
  AssignElectriciansModalProps
> = ({ workOrder, onClose, onReload, onError }) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { getListElectricians, patchSaveAssingElectricians } =
    useVisitAsignment();
  const [electricians, setElectricians] = useState<IElectrician[]>([]);
  const [selectedLead, setSelectedLead] = useState<IElectrician | undefined>();
  const [assistants, setAssistants] = useState<IElectrician[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workOrder.id) {
      getListElectricians.mutate(workOrder.id, {
        onSuccess: (data) => {
          setElectricians(data);
          const leadElectrician = data.find(
            (electrician) =>
              electrician.roles &&
              electrician.roles.includes('LEAD') &&
              electrician.is_assigned
          );
          if (leadElectrician) {
            setSelectedLead(leadElectrician);
          }
          const assignedAssistants = data.filter(
            (electrician) =>
              electrician.roles &&
              electrician.roles.includes('ASSISTANT') &&
              electrician.is_assigned
          );
          if (assignedAssistants.length > 0) {
            setAssistants(assignedAssistants);
          } else {
            setAssistants([]);
          }
        },
        onError: () => {
          setError(t('assign_electricians.errors.load_error'));
        },
      });
    }
  }, [workOrder.id]);

  const leadOptions = electricians.filter((e) => {
    if (selectedLead?.id === e.id) return true;
    const isAssignedAsAssistant = assistants.some((a) => a.id === e.id);
    return !isAssignedAsAssistant;
  });

  const assistantOptions = (currentAssistantId: string) =>
    electricians.filter((e) => {
      if (e.id === currentAssistantId) return true;
      if (selectedLead?.id === e.id) return false;
      const isAssignedAsOtherAssistant = assistants.some(
        (a) => a.id === e.id && a.id !== currentAssistantId
      );
      return !isAssignedAsOtherAssistant;
    });

  const handleAddAssistant = () => {
    setAssistants([
      ...assistants,
      { id: '', name: '', roles: [], is_assigned: false },
    ]);
  };

  const handleAssistantChange = (val: string, idx: number) => {
    const selected = electricians.find((e) => e.id === val);
    if (!selected) return;
    const newAssistants = [...assistants];
    newAssistants[idx] = selected;
    setAssistants(newAssistants);
  };

  const handleDeleteAssistant = (idx: number) => {
    setAssistants(assistants.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    setError(null);
    if (!selectedLead) {
      setError(t('assign_electricians.errors.no_lead'));
      setTimeout(() => {
        setError(null);
      }, 1000);
      return;
    }
    if (assistants.some((a) => !a.id)) {
      setError(t('assign_electricians.errors.incomplete_assistants'));
      setTimeout(() => {
        setError(null);
      }, 1000);
      return;
    }
    patchSaveAssingElectricians.mutate(
      {
        activity_id: workOrder.id,
        body: {
          contractor_id: workOrder.contractor_id,
          electrician_lead: selectedLead,
          electrician_assistants: assistants.filter((a) => a.id),
        },
      },
      {
        onSuccess: () => {
          onReload();
        },
        onError: () => {
          setError(t('assing_visit_error'));
          if (onError) onError();
        },
      }
    );
  };

  const isLeadSelected = !!selectedLead && !!selectedLead.id;
  const isLoading =
    getListElectricians.isPending || patchSaveAssingElectricians.isPending;

  return (
    <div style={{ position: 'relative' }}>
      <BiaModalDesktop
        isOpen={true}
        onClose={onClose}
        title={t('assign_electricians.title')}
        width={414}
        height={500}
        confirmText={t('assign_electricians.confirm')}
        cancelText={t('assign_electricians.cancel')}
        onConfirm={handleConfirm}
        onCancel={onClose}
        confirmDisabled={!isLeadSelected || isLoading}
      >
        <div className={styles.cardOT}>
          <span className={styles.title}>{workOrder.job_code}</span>
          <div className={styles.otInfoRow}>
            <BiaText
              token='caption'
              color='standard'
              className={styles.rowTitle}
            >
              {t('table.service_type')}
            </BiaText>
            <BiaText
              token='caption'
              color='weak'
            >
              {workOrder.service_type?.name}
            </BiaText>
          </div>
          <div className={styles.otInfoRow}>
            <BiaText
              token='caption'
              color='standard'
              className={styles.rowTitle}
            >
              {t('table.start_date')}
            </BiaText>
            <BiaText
              token='caption'
              color='weak'
            >
              {workOrder.start_date} | {workOrder.hours}
            </BiaText>
          </div>
          <div className={styles.otInfoRow}>
            <BiaText
              token='caption'
              color='standard'
              className={styles.rowTitle}
            >
              {t('table.city_name')}
            </BiaText>
            <BiaText
              token='caption'
              color='weak'
            >
              {workOrder.city_name}
            </BiaText>
          </div>
        </div>
        <div className={styles.selectSection}>
          <BiaText
            token='caption'
            color='weak'
          >
            {t('assign_electricians.lead')}
          </BiaText>
          <BiaDropdown
            options={leadOptions.map((e) => ({
              label: e.name,
              value: e.id,
            }))}
            value={selectedLead?.id || ''}
            onChange={(val) => {
              const found = electricians.find((e) => e.id === val);
              if (found) setSelectedLead(found);
            }}
            placeholder={t('assign_electricians.lead_placeholder')}
            searchable
            className={styles.leadDropdown}
            multiple={false}
          />
        </div>
        {assistants.map((assistant, idx) => (
          <div
            className={styles.selectSection}
            key={idx}
          >
            <BiaText
              token='caption'
              color='weak'
            >
              {t('assign_electricians.assistant')}
            </BiaText>
            <div className={styles.assistantDropdown}>
              <BiaDropdown
                options={assistantOptions(assistant.id).map((e) => ({
                  label: e.name,
                  value: e.id,
                }))}
                value={assistant.id}
                onChange={(val) => handleAssistantChange(val as string, idx)}
                placeholder={t('assign_electricians.assistant_placeholder')}
                searchable
                className={styles.leadDropdown}
                multiple={false}
              />
              <button
                type='button'
                className={styles.deleteAssistantBtn}
                onClick={() => handleDeleteAssistant(idx)}
                aria-label={t('assign_electricians.delete_assistant')}
              >
                <BiaIcon
                  iconName='faTrashCan'
                  iconType='regular'
                  size='12px'
                  color='strong'
                />
              </button>
            </div>
          </div>
        ))}
        <button
          type='button'
          className={styles.addAssistantBtn}
          onClick={handleAddAssistant}
          disabled={!isLeadSelected || isLoading}
        >
          <div className={styles.addAssistantBtnIcon}>
            <BiaIcon
              iconName='faPlus'
              iconType='solid'
              size='12px'
              color={!isLeadSelected ? 'disabled' : 'strong'}
            />
          </div>
          <BiaText
            token='caption'
            color={!isLeadSelected ? 'disabled' : 'strong'}
            className={styles.addAssistantBtnText}
          >
            {t('assign_electricians.add_assistant')}
          </BiaText>
        </button>
      </BiaModalDesktop>

      {isLoading && <BiaLoader />}

      {error && (
        <BiaToast
          message={error}
          theme='error'
        />
      )}
    </div>
  );
};
