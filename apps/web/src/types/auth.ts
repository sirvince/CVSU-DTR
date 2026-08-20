export interface AuthTokenResponse {
  accessToken: string
}

// Decoded shape of GET /auth/me — the JWT payload, not the teacher profile.
// See docs/api/teacher-profile.md for the separate profile (name, employeeId, etc).
export interface CurrentUser {
  sub: string
  email: string
  role: 'TEACHER' | 'ADMIN'
  iat: number
  exp: number
}
