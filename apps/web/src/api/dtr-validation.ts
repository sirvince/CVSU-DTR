import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { DtrDayWithWarnings } from '@/types/dtr-day'

// Non-blocking, informational only — see docs/api/dtr-validation.md.
export async function validateDtrPeriod(dtrPeriodId: string): Promise<DtrDayWithWarnings[]> {
  const { data } = await apiClient.post<ApiResponse<DtrDayWithWarnings[]>>('/dtr/validate', {
    dtrPeriodId,
  })
  return data.data!
}
