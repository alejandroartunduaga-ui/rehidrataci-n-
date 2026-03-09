import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BiaIcon, BiaLoader, BiaText, BiaToast } from '@entropy/index';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonSelect,
  IonSelectOption,
  useIonRouter,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useVisitAsignment } from '@visits/data/hooks';
import {
  ActivityStatus,
  IAssingElectriciansRequest,
  IElectrician,
} from '@visits/data/interfaces/visits.interface';
import { useVisitStore } from '@visits/store/useVisitStore';
import { TranslationNamespaces } from '@shared/i18n';
import { useAuthStore } from '@shared/index';
import { Card } from '../Card';
import styles from './AssingElectricians.module.css';

interface RouteParams {
  activity_id: string;
}

export const AssingElectricians = () => {
  const router = useIonRouter();
  const { t } = useTranslation(TranslationNamespaces.VISITS);
  const { activity_id } = useParams<RouteParams>();
  const { user } = useAuthStore();
  const { visit, loadVisit } = useVisitStore.getState();
  const { getListElectricians, patchSaveAssingElectricians } =
    useVisitAsignment();
  const [errorAssigned, setErrorAssigned] = useState<boolean>(false);
  const [hasEmptyAssistant, setHasEmptyAssistant] = useState<boolean>(false);

  const [selectedLead, setSelectedLead] = useState<IElectrician>();
  const [assistants, setAssistants] = useState<IElectrician[]>([
    { id: '', name: '', roles: [], is_assigned: false },
  ]);

  useEffect(() => {
    loadVisit();
    getListElectricians.mutate(activity_id, {
      onSuccess: (data) => {
        const leadElectrician = data.find(
          (electrician) =>
            electrician.roles && electrician.roles.includes('LEAD')
        );
        if (leadElectrician) {
          setSelectedLead(leadElectrician);
        } else {
          setSelectedLead(data[0]);
        }
        const assistantElectricians = data.filter(
          (electrician) =>
            electrician.roles && electrician.roles.includes('ASSISTANT')
        );
        if (assistantElectricians.length > 0) {
          setAssistants(assistantElectricians);
        }
      },
    });
  }, [activity_id]);

  const addElectricianAssistant = () => {
    setAssistants([
      ...assistants,
      { id: '', name: '', roles: [], is_assigned: false },
    ]);
  };

  const saveAssistant = (assistantSelected: IElectrician, index: number) => {
    const newAssistants = [...assistants];
    newAssistants[index] = assistantSelected;
    setAssistants(newAssistants);
  };

  const deleteElectrician = (index: number) => {
    setAssistants(assistants.filter((_, i) => i !== index));
  };

  const hasValidAssistant = () => {
    return assistants.some((assistant) => assistant.id && assistant.name);
  };

  const saveAssignment = () => {
    const hasEmptyAssistant = assistants.some(
      (assistant) => !assistant.id || !assistant.name
    );
    setHasEmptyAssistant(hasEmptyAssistant);

    if (hasEmptyAssistant) {
      setTimeout(() => {
        setHasEmptyAssistant(!hasEmptyAssistant);
      }, 5000);
      return;
    }

    if (selectedLead !== undefined) {
      const params: IAssingElectriciansRequest = {
        activity_id: activity_id,
        body: {
          contractor_id: user!.user.contractor.code,
          electrician_lead: selectedLead,
          electrician_assistants: assistants.length > 0 ? assistants : [],
        },
      };
      patchSaveAssingElectricians.mutate(params, {
        onSuccess: (data) => {
          if (
            data.electrician_status_id === ActivityStatus.ASSIGNED ||
            data.electrician_status_id === ActivityStatus.REASSIGNED
          ) {
            router.push('/home');
          } else {
            setErrorAssigned(true);
          }
        },
      });
    }
  };

  return (
    <>
      <IonContent className={styles.wrapper}>
        {getListElectricians.isPending ||
          (patchSaveAssingElectricians.isPending && (
            <BiaLoader
              color='accent'
              className={styles.loader}
            />
          ))}

        {visit.activity_id && (
          <Card
            className={styles.card}
            key={visit.activity_id}
          >
            <div className={styles.tagBlack}>
              <BiaText
                token='caption'
                color='inverse'
              >
                {visit.card_information.activity_type}
              </BiaText>
            </div>

            <div>
              <BiaText
                token='caption'
                color='strong'
              >
                {t('or')}
              </BiaText>
              <BiaText
                token='caption'
                color='weak'
              >
                {visit.card_information.network_operator}
              </BiaText>
            </div>

            <BiaText token='heading-3'>
              {visit.card_information.user_name}
            </BiaText>

            <BiaText
              token='bodyRegular'
              color='weak'
            >
              {visit.card_information.address}
            </BiaText>

            <BiaText token='bodyRegular'>
              {`${visit.card_information.activity_date} ${visit.card_information.time_slot}`}
            </BiaText>
          </Card>
        )}

        <div className={styles.selectWrapper}>
          <div className={styles.select}>
            <IonSelect
              label={t('electrician_lead')}
              labelPlacement='floating'
              fill='outline'
              value={selectedLead}
              onIonChange={(e) => setSelectedLead(e.detail.value)}
            >
              {getListElectricians.data?.map((electrician) => (
                <IonSelectOption
                  key={electrician.id}
                  value={electrician}
                >
                  {electrician.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>

          {assistants.map((assistant, index) => (
            <div
              key={index}
              className={styles.rowSelect}
            >
              {assistant.roles.includes('ASSISTANT') ? (
                <IonSelect
                  label={t('electrician_assistants')}
                  labelPlacement='floating'
                  fill='outline'
                  value={assistant.id}
                  onIonChange={(e) => {
                    const selectedId = e.detail.value;
                    const selectedElectrician = getListElectricians.data?.find(
                      (electrician) => electrician.id === selectedId
                    );
                    if (selectedElectrician) {
                      saveAssistant(selectedElectrician, index);
                    }
                  }}
                >
                  {getListElectricians.data?.map((electrician) => (
                    <IonSelectOption
                      key={electrician.id}
                      value={electrician.id}
                      disabled={assistants.some(
                        (existingAssistant) =>
                          existingAssistant.id === electrician.id
                      )}
                    >
                      {electrician.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              ) : (
                <IonSelect
                  label={t('electrician_assistants')}
                  labelPlacement='floating'
                  fill='outline'
                  value={assistant}
                  onIonChange={(e) => saveAssistant(e.detail.value, index)}
                >
                  {getListElectricians.data?.map((electrician) => (
                    <IonSelectOption
                      key={electrician.id}
                      value={electrician}
                      disabled={assistants.some(
                        (existingAssistant) =>
                          existingAssistant.id === electrician.id
                      )}
                    >
                      {electrician.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              )}
              <IonButton
                className={styles.delecteElectricianButton}
                onClick={() => deleteElectrician(index)}
              >
                <BiaIcon
                  iconName='faTrashCan'
                  iconType='regular'
                  size='16px'
                  color='strong'
                />
              </IonButton>
            </div>
          ))}

          <IonButton
            expand='block'
            className={styles.addButton}
            onClick={addElectricianAssistant}
          >
            <BiaIcon
              iconName='faPlus'
              iconType='solid'
              size='16px'
              color='accent'
              className={styles.iconButton}
            />
            {t('add_electrician_assistants')}
          </IonButton>
        </div>
      </IonContent>
      <IonFooter>
        <footer className={styles.footer}>
          <IonButton
            expand='block'
            onClick={saveAssignment}
            {...(!selectedLead || !hasValidAssistant()
              ? { disabled: true }
              : {})}
          >
            {t('save_assignment')}
          </IonButton>
        </footer>
      </IonFooter>

      {(patchSaveAssingElectricians.isError ||
        patchSaveAssingElectricians.data?.error ||
        errorAssigned) && (
        <BiaToast
          title={t('error_title')}
          message={t('error_description')}
          theme='error'
        />
      )}

      {hasEmptyAssistant && (
        <BiaToast
          message={t('alert_empty_assistent')}
          theme='error'
        />
      )}

      {patchSaveAssingElectricians.isSuccess && !errorAssigned && (
        <BiaToast
          message={t('assing_visit_success')}
          theme='success'
        />
      )}
    </>
  );
};
