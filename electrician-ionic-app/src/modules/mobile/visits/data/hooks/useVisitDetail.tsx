import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient, useAuthStore } from '@shared/index';
import { db } from '@shared/db/dbVisits';
import { IVisitDetail } from '../interfaces/visitDetail.interface';
import { visitsEndpoints } from '../endpoints/visits.endpoints';


import { useRevertActWidgets } from './useRevertActWidgets';
import { useRevertActHydration } from './useRevertActHydration';

interface IuseVisitDetailProps {
  activity_id: string;
}

export const useVisitDetail = ({ activity_id }: IuseVisitDetailProps) => {
  const [localVisitDetail, setLocalVisitDetail] = useState<IVisitDetail | undefined>();

  // userId desde auth store
  const auth = useAuthStore();
    
    const userId =
    (auth as any)?.user?.id ??
    (auth as any)?.userId ??
    (auth as any)?.user?.userId ??
    null;


  const fetchLocalDetail = async () => {
    const detail = await db.detailVisits.get(activity_id);
    setLocalVisitDetail(detail?.data as IVisitDetail);
  };

  const { data, isLoading } = useQuery<IVisitDetail>({
    queryKey: ['visitDetail', activity_id],
    queryFn: async () => {
      const resp = await httpClient.get<IVisitDetail>(
        visitsEndpoints.getActivitiesDescriptions,
        {
          headers: { 'x-time-zone': '-5' },
          queryParams: { activity_id },
        }
      );
      return resp;
    },
  });

  // Nota: evitar logs de payloads grandes (pueden congelar la app)
  
  const detailAny: any = data ?? localVisitDetail;

    const statusValue: string | undefined =
      detailAny?.typeActivity ??
      detailAny?.activity_status ??
      detailAny?.status ??
      detailAny?.state ??
      detailAny?.card_information?.activity_type ??      // por si viene ahí
      detailAny?.card_information?.typeActivity;

  const isRevertAct: boolean = statusValue === 'REVERT_ACT';

  // Widgets
  const {
    data: revertWidgets,
    loading: revertWidgetsLoading,
    error: revertWidgetsError,
  } = useRevertActWidgets({
    enabled: isRevertAct,
    activityId: activity_id,
    userId,
  });

  // Rehidratación fase 1/2
  const { formState: revertFormState, phase: revertHydrationPhase } =
    useRevertActHydration({
      enabled: isRevertAct,
      activityId: activity_id,
      widgetsResponse: revertWidgets,
    });

  return {
    data,
    isLoading,
    localVisitDetail,
    fetchLocalDetail,

    // extras para REVERT_ACT
    isRevertAct,
    revertWidgets,
    revertWidgetsLoading,
    revertWidgetsError,
    revertFormState,
    revertHydrationPhase,
  };
};
