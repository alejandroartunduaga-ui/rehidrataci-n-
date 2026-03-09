export enum NotificationType {
  SIMPLE = 'SIMPLE',
  VISIT = 'VISIT',
}
export interface INotification {
  id: string;
  type: string;
  url: string;
  message: string;
  is_view: boolean | string;
  title: string;
  data: INotificationData;
  icon: string;
}

export interface INotificationData {
  visit_id: string;
}

export interface INotificationsResponse {
  notifications: INotification[];
}
