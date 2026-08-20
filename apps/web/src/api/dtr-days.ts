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

// Mainly for removing an auto-created holiday row that doesn't apply to a
// given teacher (see CLAUDE.md's "Automatic Philippine holidays" section) —
// not restricted to holiday-status rows, a teacher can remove any day.
export async function deleteDtrDay(dtrPeriodId: string, date: string): Promise<void> {
  await apiClient.delete(`/dtr/days/${date}`, { params: { dtrPeriodId } })
}
