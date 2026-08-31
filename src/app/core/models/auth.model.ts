export type UserRole = 'Viewer' | 'SalesManager' | 'WorkspaceAdmin' | 'SystemAdmin';

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  workspaceId: string;
  hasCompletedOnboarding: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  workspaceName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: CurrentUser;
}
