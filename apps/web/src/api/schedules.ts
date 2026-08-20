import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { TeacherSchedule, TeacherScheduleFormValues } from '@/types/schedule'

export const SCHEDULES_QUERY_KEY = ['schedules'] as const

export async function fetchSchedules(academicPeriodId?: string): Promise<TeacherSchedule[]> {
  const { data } = await apiClient.get<ApiResponse<TeacherSchedule[]>>('/schedules', {
    params: academicPeriodId ? { academicPeriodId } : undefined,
  })
  return data.data!
}

export async function createSchedule(
  values: TeacherScheduleFormValues,
): Promise<TeacherSchedule> {
  const { data } = await apiClient.post<ApiResponse<TeacherSchedule>>('/schedules', values)
  return data.data!
}

export async function updateSchedule(
  id: string,
  values: Partial<TeacherScheduleFormValues>,
): Promise<TeacherSchedule> {
  const { data } = await apiClient.patch<ApiResponse<TeacherSchedule>>(`/schedules/${id}`, values)
  return data.data!
}

export async function deleteSchedule(id: string): Promise<void> {
  await apiClient.delete(`/schedules/${id}`)
}
