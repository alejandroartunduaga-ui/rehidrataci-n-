export type RevertActWidgetsResponse = unknown;

export const getRevertActWidgets = async (params: {
  baseUrl: string;     // "https://internal.dev.bia.app"
  userId: string;      // x-user-id
  activityId: string;  // activity_id
  pageCode: string;    // page_code
  signal?: AbortSignal;
}): Promise<RevertActWidgetsResponse> => {
  const { baseUrl, userId, activityId, pageCode, signal } = params;

  const url =
    `${baseUrl}/ms-electricians-api/v2/activities/pages/revert-act/widgets` +
    `?activity_id=${encodeURIComponent(activityId)}` +
    `&page_code=${encodeURIComponent(pageCode)}`;

  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'x-user-id': userId },
    signal,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(text || `Error revert-act-widgets (${resp.status})`);
  }

  return resp.json();
};