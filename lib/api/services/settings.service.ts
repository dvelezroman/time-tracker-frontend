import apiClient from '../client';

export interface Settings {
  emailNotificationsEnabled: boolean;
  whatsAppNotificationsEnabled: boolean;
}

export interface UpdateSettingsRequest {
  emailNotificationsEnabled?: boolean;
  whatsAppNotificationsEnabled?: boolean;
}

export const settingsService = {
  getSettings: async (): Promise<Settings> => {
    const response = await apiClient.get<Settings>('/settings');
    return response.data;
  },

  updateSettings: async (data: UpdateSettingsRequest): Promise<Settings> => {
    const response = await apiClient.patch<Settings>('/settings', data);
    return response.data;
  },
};
