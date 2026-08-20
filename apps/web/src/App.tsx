import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { RequireAdmin } from '@/auth/RequireAdmin'
import { Layout } from '@/components/Layout'
import { queryClient } from '@/lib/query-client'
import { AcademicPeriodsPage } from '@/pages/AcademicPeriodsPage'
import { AdminAcademicPeriodsPage } from '@/pages/admin/AdminAcademicPeriodsPage'
import { AdminTeacherDtrPage } from '@/pages/admin/AdminTeacherDtrPage'
import { AdminTeachersPage } from '@/pages/admin/AdminTeachersPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DtrDayEditorPage } from '@/pages/DtrDayEditorPage'
import { DtrPeriodDetailPage } from '@/pages/DtrPeriodDetailPage'
import { DtrPeriodsPage } from '@/pages/DtrPeriodsPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SchedulePage } from '@/pages/SchedulePage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/academic-periods" element={<AcademicPeriodsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/dtr" element={<DtrPeriodsPage />} />
            <Route path="/dtr/:periodId" element={<DtrPeriodDetailPage />} />
            <Route path="/dtr/:periodId/:date" element={<DtrDayEditorPage />} />

            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminTeachersPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/academic-periods"
              element={
                <RequireAdmin>
                  <AdminAcademicPeriodsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/teachers/:teacherId/dtr"
              element={
                <RequireAdmin>
                  <AdminTeacherDtrPage />
                </RequireAdmin>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
