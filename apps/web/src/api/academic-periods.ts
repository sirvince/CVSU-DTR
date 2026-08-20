import { apiClient } from '@/lib/api-client'
import type { AcademicPeriod, AcademicPeriodFormValues } from '@/types/academic-period'
import type { ApiResponse } from '@/types/api'

export const ACADEMIC_PERIODS_QUERY_KEY = ['academic-periods'] as const

export async function fetchAcademicPeriods(): Promise<AcademicPeriod[]> {
  const { data } = await apiClient.get<ApiResponse<AcademicPeriod[]>>('/academic-periods')
  return data.data!
}

export async function createAcademicPeriod(
  values: AcademicPeriodFormValues,
): Promise<AcademicPeriod> {
  const { data } = await apiClient.post<ApiResponse<AcademicPeriod>>('/academic-periods', values)
  return data.data!
}

export async function updateAcademicPeriod(
  id: string,
  values: Partial<AcademicPeriodFormValues>,
): Promise<AcademicPeriod> {
  const { data } = await apiClient.patch<ApiResponse<AcademicPeriod>>(
    `/academic-periods/${id}`,
    values,
  )
  return data.data!
}

export async function deleteAcademicPeriod(id: string): Promise<void> {
  await apiClient.delete(`/academic-periods/${id}`)
}
