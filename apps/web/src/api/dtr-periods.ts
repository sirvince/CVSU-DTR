import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { DtrPeriod, DtrPeriodFormValues } from '@/types/dtr-period'

export const DTR_PERIODS_QUERY_KEY = ['dtr-periods'] as const

export async function fetchDtrPeriods(academicPeriodId?: string): Promise<DtrPeriod[]> {
  const { data } = await apiClient.get<ApiResponse<DtrPeriod[]>>('/dtr/periods', {
    params: academicPeriodId ? { academicPeriodId } : undefined,
  })
  return data.data!
}

export async function fetchDtrPeriod(id: string): Promise<DtrPeriod> {
  const { data } = await apiClient.get<ApiResponse<DtrPeriod>>(`/dtr/periods/${id}`)
  return data.data!
}

export async function createDtrPeriod(values: DtrPeriodFormValues): Promise<DtrPeriod> {
  const { data } = await apiClient.post<ApiResponse<DtrPeriod>>('/dtr/periods', values)
  return data.data!
}

export async function updateDtrPeriod(
  id: string,
  values: Partial<DtrPeriodFormValues>,
): Promise<DtrPeriod> {
  const { data } = await apiClient.patch<ApiResponse<DtrPeriod>>(`/dtr/periods/${id}`, values)
  return data.data!
}

export async function deleteDtrPeriod(id: string): Promise<void> {
  await apiClient.delete(`/dtr/periods/${id}`)
}
