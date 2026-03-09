// 📝 Request para desuscribirse de notificaciones
export interface INotificationsUnsubscribeRequest {
  token: string;
  platform?: 'ios' | 'android' | 'web';
  user_id?: string;
  device_id?: string;
  reason?:
    | 'user_request'
    | 'token_refresh'
    | 'app_uninstall'
    | 'user_logout'
    | 'other';
  unsubscribe_from_all?: boolean;
  topics_to_unsubscribe?: string[];
}

// 📝 Response de desuscripción de notificaciones
export interface INotificationsUnsubscribeResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    platform: string;
    user_id: string;
    device_id: string;
    unsubscribed_topics: string[];
    unsubscribed_at: string;
    remaining_subscriptions: number;
    was_active: boolean;
  };
  timestamp: string;
}

// 📝 Error de desuscripción
export interface INotificationsUnsubscribeError {
  success: false;
  error: string;
  error_code: string;
  details?: {
    field?: string;
    message?: string;
  }[];
  timestamp: string;
}
