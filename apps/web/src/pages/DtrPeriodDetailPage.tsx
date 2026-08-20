import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DTR_CALENDAR_QUERY_KEY, fetchDtrCalendar, generateDtrCalendar } from '@/api/dtr-calendar'
import { fetchDtrDay } from '@/api/dtr-days'
import { fetchDtrPeriod } from '@/api/dtr-periods'
import { downloadDtrExcel, generateDtrExcel } from '@/api/dtr-generation'
import { validateDtrPeriod } from '@/api/dtr-validation'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { dayOfWeekLabel, formatTime } from '@/lib/date'
import { getErrorMessage, resolveErrorMessage } from '@/lib/errors'
import type { DtrDay, DtrDayWithWarnings } from '@/types/dtr-day'

export function DtrPeriodDetailPage() {
  const { periodId } = useParams<{ periodId: string }>()
  const queryClient = useQueryClient()
  const [validated, setValidated] = useState<DtrDayWithWarnings[] | null>(null)
  const [generateDownloadError, setGenerateDownloadError] = useState<string | null>(null)

  const periodQuery = useQuery({
    queryKey: ['dtr-periods', periodId],
    queryFn: () => fetchDtrPeriod(periodId!),
    enabled: Boolean(periodId),
  })

  const calendarQuery = useQuery({
    queryKey: [...DTR_CALENDAR_QUERY_KEY, periodId],
    queryFn: () => fetchDtrCalendar(periodId!),
    enabled: Boolean(periodId),
  })

  const generateCalendarMutation = useMutation({
    mutationFn: () => generateDtrCalendar(periodId!),
    onSuccess: (days) => {
      queryClient.setQueryData([...DTR_CALENDAR_QUERY_KEY, periodId], days)
      setValidated(null)
    },
  })

  const validateMutation = useMutation({
    mutationFn: () => validateDtrPeriod(periodId!),
    onSuccess: (days) => setValidated(days),
  })

  // A separate "Generate" step followed by a "Download" step leaves a window
  // where the download button silently points at a now-stale file if the
  // teacher edits another day in between (this is exactly what happened in
  // testing — see CLAUDE.md's "Frontend" section). Collapsing them into one
  // action means there's no stale intermediate state to fall into: every
  // download is preceded by a fresh generate against current data.
  const generateAndDownloadMutation = useMutation({
    mutationFn: async () => {
      const generation = await generateDtrExcel(periodId!)
      await downloadDtrExcel(generation.id, generation.fileName)
      return generation
    },
    onMutate: () => setGenerateDownloadError(null),
    // resolveErrorMessage handles both a normal JSON error (from the generate
    // step) and a Blob-typed error (from the download step) — see lib/errors.ts.
    onError: async (error) => setGenerateDownloadError(await resolveErrorMessage(error)),
  })

  if (!periodId) {
    return <Alert variant="error">No DTR period specified.</Alert>
  }

  const rows: (DtrDay | DtrDayWithWarnings)[] = validated ?? calendarQuery.data ?? []
  const totalWarnings = validated?.reduce((sum, day) => sum + day.warnings.length, 0) ?? 0

  // ENH-001: same pre-fill-from-schedule treatment as the Day Editor, applied here as a
  // read-only display — a REGULAR day with no saved time yet shows its scheduled time
  // muted instead of "—", so the calendar previews what a fresh day would default to. Pure
  // display: nothing is read from or written to the row itself, so BR-004 doesn't even
  // come into play the way it does for the editor's actual form field.
  function renderAttendanceCell(actual: string | null | undefined, scheduled: string | null | undefined, status: string) {
    if (actual) return formatTime(actual)
    if (status === 'REGULAR' && scheduled) {
      return <span className="text-slate-400">{formatTime(scheduled)}</span>
    }
    return formatTime(actual)
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/dtr" className="text-sm text-sky-600 hover:text-sky-700">
          ← Back to DTR periods
        </Link>
      </div>

      <PageHeader
        title={periodQuery.data?.label || (periodQuery.data ? `${periodQuery.data.startDate} – ${periodQuery.data.endDate}` : 'DTR Period')}
        description="Generate the calendar from your schedule, enter attendance per day, validate, then generate the Excel file."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => generateCalendarMutation.mutate()}
          isLoading={generateCalendarMutation.isPending}
        >
          {rows.length > 0 ? 'Regenerate calendar' : 'Generate calendar'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => validateMutation.mutate()}
          isLoading={validateMutation.isPending}
          disabled={rows.length === 0}
        >
          Validate
        </Button>
        <Button
          onClick={() => generateAndDownloadMutation.mutate()}
          isLoading={generateAndDownloadMutation.isPending}
          disabled={rows.length === 0}
        >
          Generate &amp; Download Excel
        </Button>
      </div>

      {generateCalendarMutation.isError && (
        <Alert variant="error">{getErrorMessage(generateCalendarMutation.error)}</Alert>
      )}
      {validateMutation.isError && <Alert variant="error">{getErrorMessage(validateMutation.error)}</Alert>}
      {generateDownloadError && <Alert variant="error">{generateDownloadError}</Alert>}
      {generateAndDownloadMutation.isSuccess && (
        <Alert variant="success">
          Downloaded {generateAndDownloadMutation.data.fileName} (version {generateAndDownloadMutation.data.version}).
        </Alert>
      )}
      {validated && (
        <Alert variant={totalWarnings > 0 ? 'error' : 'success'}>
          {totalWarnings > 0
            ? `${totalWarnings} warning${totalWarnings === 1 ? '' : 's'} found — review before generating.`
            : 'No warnings — looks good.'}
        </Alert>
      )}

      <div className="mt-4">
        {calendarQuery.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {calendarQuery.isError && <Alert variant="error">{getErrorMessage(calendarQuery.error)}</Alert>}

        {rows.length === 0 && calendarQuery.isSuccess && (
          <p className="text-sm text-slate-500">
            No days generated yet — click "Generate calendar" to create one row per scheduled date.
          </p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Day</th>
                  <th className="px-4 py-2 font-medium">Arrival</th>
                  <th className="px-4 py-2 font-medium">Departure</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  {validated && <th className="px-4 py-2 font-medium">Warnings</th>}
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((day) => (
                  <tr key={day.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">{day.date}</td>
                    <td className="px-4 py-2">{dayOfWeekLabel(day.date)}</td>
                    <td className="px-4 py-2">{renderAttendanceCell(day.arrivalTime, day.scheduleStartTime, day.status)}</td>
                    <td className="px-4 py-2">{renderAttendanceCell(day.departureTime, day.scheduleEndTime, day.status)}</td>
                    <td className="px-4 py-2">{day.status}</td>
                    {validated && (
                      <td className="px-4 py-2">
                        {'warnings' in day && day.warnings.length > 0 ? (
                          <ul className="space-y-0.5 text-amber-700">
                            {day.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-600">OK</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2 text-right">
                      <Link to={`/dtr/${periodId}/${day.date}`}>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            void queryClient.prefetchQuery({
                              queryKey: ['dtr-day', periodId, day.date],
                              queryFn: () => fetchDtrDay(periodId!, day.date),
                            })
                          }}
                        >
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
