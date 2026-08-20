// Matches apps/api's common/dto/api-response.dto.ts envelope — see docs/api/README.md.
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}
