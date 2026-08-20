import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ADMIN_TEACHERS_QUERY_KEY, fetchAllTeachers } from '@/api/admin'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { getErrorMessage } from '@/lib/errors'

export function AdminTeachersPage() {
  const teachersQuery = useQuery({
    queryKey: ADMIN_TEACHERS_QUERY_KEY,
    queryFn: fetchAllTeachers,
  })

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Every registered teacher account. Open a teacher's DTR periods to generate an Excel file on their behalf."
      />

      <div className="mb-4">
        <Link to="/admin/academic-periods">
          <Button variant="secondary">Manage academic periods</Button>
        </Link>
      </div>

      {teachersQuery.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {teachersQuery.isError && <Alert variant="error">{getErrorMessage(teachersQuery.error)}</Alert>}

      {teachersQuery.data && teachersQuery.data.length === 0 && (
        <p className="text-sm text-slate-500">No teachers have registered yet.</p>
      )}

      {teachersQuery.data && teachersQuery.data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Employee ID</th>
                <th className="px-4 py-2 font-medium">Position / Department / Campus</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {teachersQuery.data.map((teacher) => {
                const profile = teacher.teacherProfile
                return (
                  <tr key={teacher.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">
                      {profile ? `${profile.lastName}, ${profile.firstName}` : <span className="text-slate-400">No profile yet</span>}
                    </td>
                    <td className="px-4 py-2">{teacher.email}</td>
                    <td className="px-4 py-2">{profile?.employeeId ?? '—'}</td>
                    <td className="px-4 py-2">
                      {profile
                        ? [profile.position, profile.department, profile.campus].filter(Boolean).join(' / ') || '—'
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link to={`/admin/teachers/${teacher.id}/dtr`}>
                        <Button variant="secondary">View DTR</Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
