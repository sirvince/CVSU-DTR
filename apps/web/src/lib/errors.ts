import axios from 'axios'
import type { ApiResponse } from '@/types/api'

// Every apps/api error response is { success: false, message, errors: string[] }.
// `errors` holds field-level validation messages (400s); `message` alone covers
// business-rule rejections (404/409) — see docs/api/README.md.
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError<ApiResponse<never>>(error)) {
    const data = error.response?.data
    if (data?.errors?.length) {
      return data.errors.join(', ')
    }
    if (data?.message) {
      return data.message
    }
  }
  return fallback
}

// axios doesn't parse an error response body as JSON when the request used
// responseType: 'blob' (e.g. the DTR file download) — it stays a raw Blob
// even on failure, so getErrorMessage above can't read `.message` off it.
// Used specifically around downloadDtrExcel's error handling.
export async function resolveErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): Promise<string> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text()
      const parsed = JSON.parse(text) as ApiResponse<never>
      if (parsed.errors?.length) return parsed.errors.join(', ')
      if (parsed.message) return parsed.message
    } catch {
      // Not JSON after all — fall through to the generic handling below.
    }
  }
  return getErrorMessage(error, fallback)
}
