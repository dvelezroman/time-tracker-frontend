import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/v0`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Get token from localStorage or store
        if (typeof window !== 'undefined') {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            try {
              const auth = JSON.parse(authStorage);
              if (auth?.state?.token) {
                config.headers.Authorization = `Bearer ${auth.state.token}`;
              }
            } catch (error) {
              console.error('Error parsing auth storage:', error);
            }
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response) {
          // Handle different error status codes
          switch (error.response.status) {
            case 401:
              // Unauthorized - clear auth and redirect to login
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-storage');
                window.location.href = '/login';
              }
              break;
            case 403:
              // Forbidden
              console.error('Access forbidden');
              break;
            case 404:
              // Not found
              console.error('Resource not found');
              break;
            case 500:
              // Server error
              console.error('Server error');
              break;
            default:
              console.error('API Error:', error.response.data);
          }
        } else if (error.request) {
          console.error('Network error:', error.request);
        } else {
          console.error('Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.client;
  }

  // Helper methods
  public async get<T>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  public async post<T>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  public async put<T>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  public async patch<T>(url: string, data?: any, config?: any) {
    return this.client.patch<T>(url, data, config);
  }

  public async delete<T>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
export default apiClient.getInstance();
