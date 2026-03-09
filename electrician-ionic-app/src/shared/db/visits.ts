import { ActivityStatus, IDescription, IField } from '@visits/index';
import { db } from './dbVisits';

export const activityInfoNext: {
  status: Record<string, ActivityStatus>;
  color: Record<string, string>;
  text: Record<string, string>;
} = {
  status: {
    [ActivityStatus.ASSIGNED]: ActivityStatus.IN_ROUTE,
    [ActivityStatus.REASSIGNED]: ActivityStatus.IN_ROUTE,
    [ActivityStatus.IN_ROUTE]: ActivityStatus.IN_ADDRESS,
    [ActivityStatus.IN_ADDRESS]: ActivityStatus.ACTIVITY_STARTED,
    [ActivityStatus.ACTIVITY_STARTED]: ActivityStatus.INIT_FORM,
    [ActivityStatus.INIT_FORM]: ActivityStatus.COMPLETED,
    [ActivityStatus.CANCELLED]: ActivityStatus.CANCELLED,
    [ActivityStatus.SITE_ACCESS_FAILED]: ActivityStatus.SITE_ACCESS_FAILED,
    [ActivityStatus.START_ACTIVITY_FAILED]:
      ActivityStatus.START_ACTIVITY_FAILED,
    [ActivityStatus.CONTINUE_ACTIVITY_FAILED]:
      ActivityStatus.CONTINUE_ACTIVITY_FAILED,
    [ActivityStatus.ASSIGNED_CONTRACTOR]: ActivityStatus.ASSIGNED_CONTRACTOR,
    [ActivityStatus.CHANGE_CONTRACTOR]: ActivityStatus.CHANGE_CONTRACTOR,
    [ActivityStatus.ACCEPTED_CONTRACTOR]: ActivityStatus.ACCEPTED_CONTRACTOR,
  },
  color: {
    [ActivityStatus.ASSIGNED]: '#8c2d55',
    [ActivityStatus.IN_ROUTE]: '#16625e',
    [ActivityStatus.IN_ADDRESS]: '#c48f33',
    [ActivityStatus.ACTIVITY_STARTED]: '#00C47A',
    [ActivityStatus.INIT_FORM]: '#00a86c',
    [ActivityStatus.CANCELLED]: '#c43333',
    [ActivityStatus.SITE_ACCESS_FAILED]: '#C46833',
    [ActivityStatus.START_ACTIVITY_FAILED]: '#C46833',
    [ActivityStatus.CONTINUE_ACTIVITY_FAILED]: '#C46833',
    [ActivityStatus.ASSIGNED_CONTRACTOR]: '#c43333',
    [ActivityStatus.CHANGE_CONTRACTOR]: '#c43333',
    [ActivityStatus.ACCEPTED_CONTRACTOR]: '#c43333',
  },
  text: {
    [ActivityStatus.ASSIGNED]: 'En camino',
    [ActivityStatus.IN_ROUTE]: 'En curso',
    [ActivityStatus.IN_ADDRESS]: 'Completando documentos',
    [ActivityStatus.ACTIVITY_STARTED]: 'Dentro de sitio',
    [ActivityStatus.INIT_FORM]: 'Completada',
    [ActivityStatus.CANCELLED]: 'Cancelada',
    [ActivityStatus.SITE_ACCESS_FAILED]: 'Fallida en curso',
    [ActivityStatus.START_ACTIVITY_FAILED]: 'Fallida en curso',
    [ActivityStatus.CONTINUE_ACTIVITY_FAILED]: 'Fallida en curso',
    [ActivityStatus.ASSIGNED_CONTRACTOR]: 'Aceptado por contratista',
    [ActivityStatus.CHANGE_CONTRACTOR]: 'Aceptado por contratista',
    [ActivityStatus.ACCEPTED_CONTRACTOR]: 'Aceptado por contratista',
  },
};

// updates the status of the visit detail in the local database
export const updateActivityStatus = async (
  activity_status: string,
  activity_id: string
) => {
  const visitDetail = await db.detailVisits.get(activity_id);

  if (visitDetail) {
    const updatedDescriptions: IDescription[] =
      visitDetail.data.descriptions.map((description) => {
        if (description.title === 'Información') {
          return {
            ...description,
            fields: description.fields.map((field: IField) => {
              if (field.title === 'Estado') {
                return {
                  ...field,
                  selected_value: [activityInfoNext.text[activity_status]],
                  color: activityInfoNext.color[activity_status],
                };
              }
              return field;
            }),
          };
        }
        return description;
      });

    await db.detailVisits.put({
      ...visitDetail,
      data: {
        ...visitDetail.data,
        activity_status: activityInfoNext.status[activity_status],
        descriptions: updatedDescriptions,
      },
    });
  }
};

// updates the status of the visit list in the local database
export const updateVisitStatus = async (
  activity_status: string,
  activity_id: string
) => {
  const visit = await db.visits.get(activity_id);

  if (visit) {
    await db.visits.put({
      ...visit,
      data: {
        ...visit.data,
        card_information: {
          ...visit.data.card_information,
          activity_status: activityInfoNext.status[activity_status],
          activity_status_color: activityInfoNext.color[activity_status],
          activity_status_title: activityInfoNext.text[activity_status],
        },
      },
    });
  }
};

export const getVisitById = async (visitId: string) => {
  return await db.visits.get(visitId);
};
