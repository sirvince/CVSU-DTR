import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  adminTeacherDtrPeriodsQueryKey,
  downloadAdminGeneratedDtr,
  fetchTeacherDtrPeriods,
  generateDtrForTeacher,
} from '@/api/admin'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { getErrorMessage, resolveErrorMessage } from '@/lib/errors'

// Same "generate then immediately download the fresh result" pattern as
// DtrPeriodDetailPage.tsx's generateAndDownloadMutation, for the same
// reason (BUG-001 in CLAUDE.md — a separate Download step can silently
// point at a stale file). One mutation shared across every row in the
// table; mutation.variables (the dtrPeriodId just generated) is what lets
// each row show its own loading/error state independently.
export function AdminTeacherDtrPage() {
  const { teacherId } = useParams<{ teacherId: string }>()
  const [rowError, setRowError] = useState<{ dtrPeriodId: string; message: string } | null>(null)

  const periodsQuery = useQuery({
    queryKey: adminTeacherDtrPeriodsQueryKey(teacherId!),
    queryFn: () => fetchTeacherDtrPeriods(teacherId!),
    enabled: Boolean(teacherId),
  })

  const generateAndDownloadMutation = useMutation({
    mutationFn: async (dtrPeriodId: string) => {
      const generation = await generateDtrForTeacher(teacherId!, dtrPeriodId)
      await downloadAdminGeneratedDtr(teacherId!, generation.id, generation.fileName)
      return generation
    },
    onMutate: () => setRowError(null),
    onError: async (error, dtrPeriodId) =>
      setRowError({ dtrPeriodId, message: await resolveErrorMessage(error) }),
  })

  if (!teacherId) {
    return <Alert variant="error">No teacher specified.</Alert>
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin" className="text-sm text-sky-600 hover:text-sky-700">
          ← Back to teachers
        </Link>
      </div>

      <PageHeader
        title="DTR Periods"
        description="Generate and download this teacher's DTR Excel file, based on their own schedule and attendance data."
      />

      {periodsQuery.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {periodsQuery.isError && <Alert variant="error">{getErrorMessage(periodsQuery.error)}</Alert>}

      {periodsQuery.data && periodsQuery.data.length === 0 && (
        <p className="text-sm text-slate-500">This teacher has no DTR periods yet.</p>
      )}

      {generateAndDownloadMutation.isSuccess && (
        <Alert variant="success">
          Downloaded {generateAndDownloadMutation.data.fileName} (version {generateAndDownloadMutation.data.version}).
        </Alert>
      )}

      {periodsQuery.data && periodsQuery.data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Label</th>
                <th className="px-4 py-2 font-medium">Start</th>
                <th className="px-4 py-2 font-medium">End</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {periodsQuery.data.map((period) => (
                <tr key={period.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{period.label || '—'}</td>
                  <td className="px-4 py-2">{period.startDate}</td>
                  <td className="px-4 py-2">{period.endDate}</td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      onClick={() => generateAndDownloadMutation.mutate(period.id)}
                      isLoading={
                        generateAndDownloadMutation.isPending &&
                        generateAndDownloadMutation.variables === period.id
                      }
                    >
                      Generate &amp; Download Excel
                    </Button>
                    {rowError && rowError.dtrPeriodId === period.id && (
                      <p className="mt-2 text-right text-sm text-red-600">{rowError.message}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
