type CacheValue = unknown;

const widgetsCache = new Map<string, CacheValue>();

export const getCachedRevertWidgets = (activityId: string) => {
  return widgetsCache.get(activityId) ?? null;
};

export const setCachedRevertWidgets = (activityId: string, data: CacheValue) => {
  widgetsCache.set(activityId, data);
};

export const clearCachedRevertWidgets = (activityId: string) => {
  widgetsCache.delete(activityId);
};