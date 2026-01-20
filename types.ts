
export interface UserSession {
  email: string;
  loggedAt: string;
}

export interface UserData {
  productId?: string;
  token?: string;
  success?: boolean;
  message?: string;
}

export enum AppScreen {
  LOGIN = 'LOGIN',
  CONFIG = 'CONFIG'
}

export interface ApiResponse {
  success: boolean | string;
  message?: string;
  userId?: string | number;
  productId?: string;
  token?: string;
}
