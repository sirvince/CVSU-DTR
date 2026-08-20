import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

// Unlike ProtectedRoute (a synchronous token-presence check), this needs the
// actual decoded user (role isn't known from the token's presence alone), so
// it consumes the async useAuth() query. Renders nothing while loading to
// avoid a flash of admin content before the role is known; ProtectedRoute
// has already guaranteed a token exists by the time this renders (it wraps
// every route in App.tsx), so isLoadingUser here is brief.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoadingUser } = useAuth()

  if (isLoadingUser) {
    return null
  }
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
