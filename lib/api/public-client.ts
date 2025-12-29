import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Public API client that does NOT include authentication tokens
 * Used for public endpoints that don't require authentication
 */
class PublicApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/v0`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  public async get<T>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  public async post<T>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }
}

export const publicApiClient = new PublicApiClient();

