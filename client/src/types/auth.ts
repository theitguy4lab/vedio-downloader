export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultFormat?: string;
  defaultQuality?: string;
  notificationsEnabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  avatar?: string;
  storageUsageBytes: number;
  preferences: UserPreferences;
  createdAt: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}
