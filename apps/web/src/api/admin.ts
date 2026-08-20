import { apiClient } from '@/lib/api-client'
import type { AdminTeacherListItem } from '@/types/admin'
import type { ApiResponse } from '@/types/api'
import type { DtrGeneration } from '@/types/dtr-generation'
import type { DtrPeriod } from '@/types/dtr-period'

export const ADMIN_TEACHERS_QUERY_KEY = ['admin', 'teachers'] as const
export const adminTeacherDtrPeriodsQueryKey = (teacherId: string) =>
  ['admin', 'teachers', teacherId, 'dtr-periods'] as const

export async function fetchAllTeachers(): Promise<AdminTeacherListItem[]> {
  const { data } = await apiClient.get<ApiResponse<AdminTeacherListItem[]>>('/admin/teachers')
  return data.data!
}

export async function fetchTeacherDtrPeriods(teacherId: string): Promise<DtrPeriod[]> {
  const { data } = await apiClient.get<ApiResponse<DtrPeriod[]>>(
    `/admin/teachers/${teacherId}/dtr-periods`,
  )
  return data.data!
}

export async function generateDtrForTeacher(
  teacherId: string,
  dtrPeriodId: string,
): Promise<DtrGeneration> {
  const { data } = await apiClient.post<ApiResponse<DtrGeneration>>(
    `/admin/teachers/${teacherId}/dtr-periods/${dtrPeriodId}/generate`,
  )
  return data.data!
}

// Same blob-download approach as api/dtr-generation.ts's downloadDtrExcel —
// this endpoint streams raw bytes, not the usual JSON envelope.
export async function downloadAdminGeneratedDtr(
  teacherId: string,
  generationId: string,
  fileName: string,
): Promise<void> {
  const response = await apiClient.get<Blob>(
    `/admin/teachers/${teacherId}/generations/${generationId}/download`,
    { responseType: 'blob' },
  )
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
