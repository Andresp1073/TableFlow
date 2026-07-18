import { post } from './api';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthSession,
} from '@/lib/auth-types';
import type { ApiResponse } from './api';

const AUTH_BASE = '/auth';

export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return post<LoginResponse>(`${AUTH_BASE}/login`, data);
}

export async function refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
  return post<RefreshTokenResponse>(`${AUTH_BASE}/refresh`, data);
}

export async function logout(refreshTokenValue: string): Promise<void> {
  await post<null>(`${AUTH_BASE}/logout`, { refreshToken: refreshTokenValue });
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> {
  return post<{ message: string }>(`${AUTH_BASE}/forgot-password`, data);
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
  return post<null>(`${AUTH_BASE}/reset-password`, data);
}

export async function getCurrentSession(): Promise<ApiResponse<AuthSession | null>> {
  return post<AuthSession | null>(`${AUTH_BASE}/sessions/current`);
}

export async function getSessions(): Promise<ApiResponse<AuthSession[]>> {
  return post<AuthSession[]>(`${AUTH_BASE}/sessions`);
}

export async function revokeSession(sessionId: string): Promise<void> {
  await post<null>(`${AUTH_BASE}/sessions/${sessionId}`);
}

export async function revokeAllSessions(): Promise<ApiResponse<null>> {
  return post<null>(`${AUTH_BASE}/sessions/revoke-all`);
}
