import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getStoredToken } from './token-storage'

// Synchronous token-presence check only — an invalid/expired token still gets
// caught by lib/api-client.ts's 401 interceptor, which hard-redirects to
// /login. This just avoids a flash of protected content when there's
// obviously no token at all.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!getStoredToken()) {
    return <Navigate to="/login" replace />
  }
  return children
}
