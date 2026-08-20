import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { AuthTokenResponse, CurrentUser } from '@/types/auth'

export interface AuthCredentials {
  email: string
  password: string
}

export async function register(credentials: AuthCredentials): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/register', credentials)
  return data.data!
}

export async function login(credentials: AuthCredentials): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/login', credentials)
  return data.data!
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get<ApiResponse<CurrentUser>>('/auth/me')
  return data.data!
}
