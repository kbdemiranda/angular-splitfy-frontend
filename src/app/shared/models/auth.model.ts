export type UserProfile = 'VIEWER' | 'EDITOR' | 'ADMIN';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  userId: string;
  email: string;
  profile: UserProfile;
}

export interface AuthSession extends LoginResponse {
  expiresAt: number;
}
