/* global fetch */
import {
  IHttpClient,
  RequestOptions,
  useAuthStore,
  VERSION,
} from '@shared/index';
import { signOut } from 'firebase/auth';
import { authFirebase } from '@shared/firebase/webFirebaseConfig';

class HttpClient {
  private mockBaseURL = import.meta.env.VITE_MOCK_URL;
  private defaultBaseURL = import.meta.env.VITE_PUBLIC_BACKEND_URL;
  private xScope = import.meta.env.VITE_SCOPE;

  private async refreshToken() {
    const { session, login, logout } = useAuthStore.getState();
    if (session?.refreshToken) {
      const url = `${this.defaultBaseURL}/bia-auth/refresh-token`;

      const response = await this.handleRequest(url, 'POST', {
        refresh_token: session.refreshToken,
      });

      const responseText = await response.json();
      const parseResponse = {
        token: responseText.access_token,
        refreshToken: responseText.refresh_token,
      };

      if (parseResponse.refreshToken !== undefined) {
        login(parseResponse, parseResponse.token, parseResponse.refreshToken);
        // window.location.reload();
      } else {
        // Si no hay refresh token válido, hacer logout
        try {
          await signOut(authFirebase);
        } catch (error) {
          console.error('Error al cerrar sesión de Firebase:', error);
        } finally {
          logout();
        }
      }
    }
  }

  // Interceptor para manejar peticiones
  private async handleRequest<D = unknown>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data?: D,
    options: RequestOptions = {}
  ): Promise<Response> {
    const { session } = useAuthStore.getState();
    const headers = options.headers || {};
    // Get token from local storage
    if (session?.token) {
      headers['Authorization'] = `${session.token}`;
      headers['x-version'] = VERSION;
    }
    headers['x-scope'] = this.xScope;

    // Add query parameters to the URL
    if (options.queryParams) {
      const query = new URLSearchParams(options.queryParams).toString();
      url = `${url}?${query}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        ...headers,
      },
      body: undefined,
    };

    if (data instanceof FormData) {
      delete headers['Content-Type'];
      requestOptions.body = data;
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
      requestOptions.headers = {
        'Content-Type': 'application/json',
        ...headers,
      };
    }

    const controller = new AbortController();
    // const timeout = options.timeout || 75000; // Default timeout of 75 seconds
    const timeout = options.timeout || 510000; // Default timeout of 8 minutes 30 seconds
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    requestOptions.signal = controller.signal;

    // eslint-disable-next-line no-undef -- fetch está en el entorno (DOM / Node 18+)
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId); // Limpiar timeout

    // Manejo de errores
    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshToken();
        return this.handleRequest(url, method, data, options);
      }

      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData?.details ||
        `Error ${response.status}: ${response.statusText}`;

      throw new Error(errorMessage);
    }

    return response;
  }

  private async makeRequest<T, D = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: IHttpClient,
    data?: D,
    options: RequestOptions = {} // Opciones adicionales
  ): Promise<T> {
    const baseURL = endpoint.isMocked ? this.mockBaseURL : this.defaultBaseURL;
    const url = `${baseURL}${endpoint.url}`;

    const response = await this.handleRequest(url, method, data, options);

    // Check if the response has content
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const contentType = response.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      // Parse JSON if content type is JSON
      return response.json();
    } else {
      // Return text or URL if it's not JSON
      return response.text() as unknown as T;
    }
  }

  // Methods for different types of requests
  async get<T>(
    endpoint: IHttpClient,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.makeRequest<T>('GET', endpoint, null, options);
  }

  async post<T, D = unknown>(
    endpoint: IHttpClient,
    data: D,
    options: RequestOptions = {} // Additional options
  ): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, data, options);
  }

  async put<T, D = unknown>(
    endpoint: IHttpClient,
    data: D,
    options: RequestOptions = {} // Additional options
  ): Promise<T> {
    return this.makeRequest<T>('PUT', endpoint, data, options);
  }

  async delete<T, D = unknown>(
    endpoint: IHttpClient,
    data?: D,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.makeRequest<T>('DELETE', endpoint, data, options);
  }

  async patch<T, D = unknown>(
    endpoint: IHttpClient,
    data?: D,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.makeRequest<T>('PATCH', endpoint, data, options);
  }
}

export const httpClient = new HttpClient();
