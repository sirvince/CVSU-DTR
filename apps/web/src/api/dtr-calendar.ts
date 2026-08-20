import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { DtrDay } from '@/types/dtr-day'

export const DTR_CALENDAR_QUERY_KEY = ['dtr-calendar'] as const

export async function fetchDtrCalendar(dtrPeriodId: string): Promise<DtrDay[]> {
  const { data } = await apiClient.get<ApiResponse<DtrDay[]>>('/dtr/calendar', {
    params: { dtrPeriodId },
  })
  return data.data!
}

// Idempotent/additive-only server-side — safe to call repeatedly (see docs/api/dtr-calendar.md).
export async function generateDtrCalendar(dtrPeriodId: string): Promise<DtrDay[]> {
  const { data } = await apiClient.post<ApiResponse<DtrDay[]>>('/dtr/calendar/generate', {
    dtrPeriodId,
  })
  return data.data!
}
