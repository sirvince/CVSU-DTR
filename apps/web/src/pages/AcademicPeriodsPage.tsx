import { useQuery } from '@tanstack/react-query'
import { ACADEMIC_PERIODS_QUERY_KEY, fetchAcademicPeriods } from '@/api/academic-periods'
import { Alert } from '@/components/Alert'
import { PageHeader } from '@/components/PageHeader'
import { getErrorMessage } from '@/lib/errors'

// Read-only for teachers — academic periods are a shared, admin-managed
// resource now (see CLAUDE.md's Deployment/architecture notes). An admin
// manages the same list with full create/edit/delete at
// pages/admin/AdminAcademicPeriodsPage.tsx (/admin/academic-periods); this
// page exists so a teacher can still see what periods are available before
// picking one for a schedule or DTR period.
export function AcademicPeriodsPage() {
  const periodsQuery = useQuery({
    queryKey: ACADEMIC_PERIODS_QUERY_KEY,
    queryFn: fetchAcademicPeriods,
  })

  return (
    <div>
      <PageHeader
        title="Academic Periods"
        description="Broad time ranges your weekly schedule and DTR periods belong to. Managed by an administrator."
      />

      {periodsQuery.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {periodsQuery.isError && <Alert variant="error">{getErrorMessage(periodsQuery.error)}</Alert>}

      {periodsQuery.data && periodsQuery.data.length === 0 && (
        <p className="text-sm text-slate-500">No academic periods yet — ask an administrator to add one.</p>
      )}

      {periodsQuery.data && periodsQuery.data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Academic Year</th>
                <th className="px-4 py-2 font-medium">Semester</th>
                <th className="px-4 py-2 font-medium">Start</th>
                <th className="px-4 py-2 font-medium">End</th>
              </tr>
            </thead>
            <tbody>
              {periodsQuery.data.map((period) => (
                <tr key={period.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{period.academicYear}</td>
                  <td className="px-4 py-2">{period.semester}</td>
                  <td className="px-4 py-2">{period.startDate}</td>
                  <td className="px-4 py-2">{period.endDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
