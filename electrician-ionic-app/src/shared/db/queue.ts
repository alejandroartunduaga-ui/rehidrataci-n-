import { httpClient } from '@shared/httpClient/httpClient';
import { db } from './dbVisits';

export const addToSyncQueue = async (
  activity_id: string,
  endpoint: string,
  data: Record<string, unknown>
) => {
  await db.syncQueue.put({
    id: crypto.randomUUID(),
    activityId: activity_id,
    endpoint,
    method: 'POST',
    body: data,
    createdAt: new Date(),
  });
};

export const syncQueueByActivityId = async (activityId: string) => {
  // Get the queue items for the activityId, sorted by creation date (FIFO)
  const syncQueue = await db.syncQueue
    .where('activityId')
    .equals(activityId)
    .sortBy('createdAt'); // Sort by creation date to maintain FIFO

  if (syncQueue.length === 0) {
    return;
  }

  for (const item of syncQueue) {
    try {
      // Prepare the endpoint for the HttpClients
      const endpoint = {
        url: item.endpoint,
        isMocked: false,
      };

      // Perform the request using HttpClient
      await httpClient.post(endpoint, item.body);
      // Remove the item from the queue after successfully processing it
      await db.syncQueue.delete(item.id);
    } catch (error) {
      console.error(`Error syncing item ${item.id}:`, error);
      throw error;
    }
  }
};
