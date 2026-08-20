import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { DtrGeneration } from '@/types/dtr-generation'

export async function generateDtrExcel(dtrPeriodId: string): Promise<DtrGeneration> {
  const { data } = await apiClient.post<ApiResponse<DtrGeneration>>('/dtr/generate', {
    dtrPeriodId,
  })
  return data.data!
}

// The download endpoint streams raw bytes (not the usual JSON envelope) and
// requires the Authorization header, so a plain <a href> can't be used — fetch
// as a blob through the authenticated apiClient, then trigger a save via a
// throwaway object URL. See docs/api/dtr-generation.md.
export async function downloadDtrExcel(generationId: string, fileName: string): Promise<void> {
  const response = await apiClient.get<Blob>(`/dtr/generate/${generationId}/download`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
