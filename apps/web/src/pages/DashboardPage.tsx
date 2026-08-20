import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ACADEMIC_PERIODS_QUERY_KEY, fetchAcademicPeriods } from '@/api/academic-periods'
import { DTR_PERIODS_QUERY_KEY, fetchDtrPeriods } from '@/api/dtr-periods'
import { validateDtrPeriod } from '@/api/dtr-validation'
import { SCHEDULES_QUERY_KEY, fetchSchedules } from '@/api/schedules'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { StatTile } from '@/components/StatTile'
import { getErrorMessage } from '@/lib/errors'

// No dedicated dashboard endpoint exists — this composes academic-periods +
// schedules + dtr-periods + dtr-validate client-side, same pattern the
// backend's DTR-011 (Preview) conclusion established for this kind of screen.
export function DashboardPage() {
  const academicPeriodsQuery = useQuery({
    queryKey: ACADEMIC_PERIODS_QUERY_KEY,
    queryFn: fetchAcademicPeriods,
  })
  const currentAcademicPeriod = academicPeriodsQuery.data?.[0]

  const schedulesQuery = useQuery({
    queryKey: [...SCHEDULES_QUERY_KEY, currentAcademicPeriod?.id],
    queryFn: () => fetchSchedules(currentAcademicPeriod!.id),
    enabled: Boolean(currentAcademicPeriod),
  })

  const dtrPeriodsQuery = useQuery({
    queryKey: [...DTR_PERIODS_QUERY_KEY, currentAcademicPeriod?.id],
    queryFn: () => fetchDtrPeriods(currentAcademicPeriod!.id),
    enabled: Boolean(currentAcademicPeriod),
  })
  const currentDtrPeriod = dtrPeriodsQuery.data?.[0]

  const validateQuery = useQuery({
    queryKey: ['dtr-validate', currentDtrPeriod?.id],
    queryFn: () => validateDtrPeriod(currentDtrPeriod!.id),
    enabled: Boolean(currentDtrPeriod),
  })

  const scheduledDays = validateQuery.data?.length ?? 0
  const completedDays =
    validateQuery.data?.filter(
      (day) => day.status !== 'REGULAR' || (day.arrivalTime && day.departureTime),
    ).length ?? 0
  const totalWarnings = validateQuery.data?.reduce((sum, day) => sum + day.warnings.length, 0) ?? 0

  if (academicPeriodsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  if (academicPeriodsQuery.isError) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <Alert variant="error">{getErrorMessage(academicPeriodsQuery.error)}</Alert>
      </div>
    )
  }

  if (!currentAcademicPeriod) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <Alert variant="info">
          Get started by creating an academic period.{' '}
          <Link to="/academic-periods" className="font-medium underline">
            Go to Academic Periods
          </Link>
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" description={`${currentAcademicPeriod.academicYear} — ${currentAcademicPeriod.semester}`} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Schedule"
          value={schedulesQuery.data && schedulesQuery.data.length > 0 ? 'Configured ✓' : 'Not set'}
        />
        <StatTile label="Current DTR Period" value={currentDtrPeriod?.label || currentDtrPeriod?.startDate || '—'} />
        <StatTile label="Scheduled Days" value={scheduledDays} />
        <StatTile label="Completed" value={completedDays} />
      </div>

      {currentDtrPeriod && totalWarnings > 0 && (
        <div className="mt-4">
          <StatTile label="Warnings" value={totalWarnings} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {currentDtrPeriod ? (
          <Link to={`/dtr/${currentDtrPeriod.id}`}>
            <Button>Open DTR</Button>
          </Link>
        ) : (
          <Link to="/dtr">
            <Button>Create a DTR period</Button>
          </Link>
        )}
        <Link to="/schedule">
          <Button variant="secondary">Edit Schedule</Button>
        </Link>
        {currentDtrPeriod && (
          <Link to={`/dtr/${currentDtrPeriod.id}`}>
            <Button variant="secondary">Generate Excel</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
