import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { TeacherProfile, TeacherProfileFormValues } from '@/types/teacher-profile'

export const PROFILE_QUERY_KEY = ['profile'] as const

export async function fetchMyProfile(): Promise<TeacherProfile> {
  const { data } = await apiClient.get<ApiResponse<TeacherProfile>>('/me/profile')
  return data.data!
}

export async function createMyProfile(values: TeacherProfileFormValues): Promise<TeacherProfile> {
  const { data } = await apiClient.post<ApiResponse<TeacherProfile>>('/me/profile', values)
  return data.data!
}

export async function updateMyProfile(
  values: Partial<TeacherProfileFormValues>,
): Promise<TeacherProfile> {
  const { data } = await apiClient.patch<ApiResponse<TeacherProfile>>('/me/profile', values)
  return data.data!
}
