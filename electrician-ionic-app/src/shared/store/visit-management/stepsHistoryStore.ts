import { create } from 'zustand';
import { db } from '@shared/db/dbVisits';
import {
  IPagesByActivityIdResponse,
  IPage,
} from '@visit-management/data/interfaces/history.interface';

interface Step {
  code: string;
  name: string;
  isComplete?: boolean;
}

interface StepsStore {
  steps: Step[];
  activityId: string | null;
  setActivityId: (activityId: string | null) => void;
  setStepCompletion: (index: number) => Promise<void>;
  setSteps: (newSteps: Step[]) => Promise<void>;
  getStepByCode: (code: string) => Step | undefined;
  findStepIndex: (code: string) => number;
}

export const useStepsStore = create<StepsStore>((set, get) => ({
  steps: [],
  activityId: null,

  setActivityId: (activityId) => {
    set({ activityId });
  },

  setStepCompletion: async (index) => {
    const { steps, activityId } = get();

    if (!activityId || index < 0 || index >= steps.length) {
      console.warn(
        '[useStepsStore] Invalid activityId or index for setStepCompletion',
        activityId,
        index
      );
      return;
    }

    const stepToUpdate = steps[index];
    if (!stepToUpdate) {
      console.warn('[useStepsStore] Step not found at index:', index);
      return;
    }

    const updatedStepsInMemory = steps.map((step, i) =>
      i === index ? { ...step, isComplete: true } : step
    );

    set({ steps: updatedStepsInMemory });

    try {
      const stepsVisitRecord = await db.stepsVisits.get(activityId);
      if (
        stepsVisitRecord &&
        stepsVisitRecord.data &&
        stepsVisitRecord.data.pages
      ) {
        const updatedDexiePages = stepsVisitRecord.data.pages.map((page) => {
          if (page.code === stepToUpdate.code) {
            return { ...page, isComplete: true };
          }
          return page;
        });

        const updatedStepsVisitData: IPagesByActivityIdResponse = {
          ...stepsVisitRecord.data,
          pages: updatedDexiePages as IPage[],
        };

        await db.stepsVisits.put({
          ...stepsVisitRecord,
          data: updatedStepsVisitData,
        });
      } else {
        console.warn(
          '[useStepsStore] Could not find record in db.stepsVisits to update for activityId:',
          activityId
        );
      }
    } catch (error) {
      console.error('[useStepsStore] Error updating db.stepsVisits:', error);
    }

    /* await storageManager.setItem(
      `steps-history-storage_${activityId}`,
      JSON.stringify({ steps: updatedStepsInMemory })
    ); */
  },

  setSteps: async (newSteps: Step[]) => {
    const { activityId } = get();
    set({ steps: newSteps });

    if (activityId) {
      /* await storageManager.setItem(
        `steps-history-storage_${activityId}`,
        JSON.stringify({ steps: newSteps })
      ); */
    }
  },

  getStepByCode: (code: string) => {
    const { steps } = get();
    return steps.find((step) => step.code === code);
  },

  findStepIndex: (code: string) => {
    const { steps } = get();
    return steps.findIndex((step) => step.code === code);
  },
}));
