import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { DtrDay, UpdateDtrDayValues } from '@/types/dtr-day'

export async function fetchDtrDay(dtrPeriodId: string, date: string): Promise<DtrDay> {
  const { data } = await apiClient.get<ApiResponse<DtrDay>>(`/dtr/days/${date}`, {
    params: { dtrPeriodId },
  })
  return data.data!
}

export async function updateDtrDay(
  dtrPeriodId: string,
  date: string,
  values: UpdateDtrDayValues,
): Promise<DtrDay> {
  const { data } = await apiClient.patch<ApiResponse<DtrDay>>(`/dtr/days/${date}`, values, {
    params: { dtrPeriodId },
  })
  return data.data!
}
