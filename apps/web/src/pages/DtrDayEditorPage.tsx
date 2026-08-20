import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChangeEvent } from 'react'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { dtrDaySchema, type DtrDayFormSchema } from '@/api/dtr-day-schema'
import { DTR_CALENDAR_QUERY_KEY } from '@/api/dtr-calendar'
import { fetchDtrDay, updateDtrDay } from '@/api/dtr-days'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { Select } from '@/components/Select'
import { TextArea } from '@/components/TextArea'
import { TextField } from '@/components/TextField'
import { dayOfWeekLabel, formatTime, shiftTimeByScheduleDuration } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import { DTR_DAY_STATUSES } from '@/types/dtr-day'

export function DtrDayEditorPage() {
  const { periodId, date } = useParams<{ periodId: string; date: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const dayQuery = useQuery({
    queryKey: ['dtr-day', periodId, date],
    queryFn: () => fetchDtrDay(periodId!, date!),
    enabled: Boolean(periodId && date),
  })

  // ENH-001: a freshly-generated day already has Arrival/Departure auto-filled from its
  // schedule server-side (dtr-calendar.service.ts) — this is just a legacy-data fallback
  // for a day generated before that existed, so it still shows a sensible starting point
  // instead of a truly blank field.
  const canPrefillFromSchedule = dayQuery.data?.status === 'REGULAR'
  const arrivalPrefilled =
    canPrefillFromSchedule && !dayQuery.data?.arrivalTime && Boolean(dayQuery.data?.scheduleStartTime)
  const departurePrefilled =
    canPrefillFromSchedule && !dayQuery.data?.departureTime && Boolean(dayQuery.data?.scheduleEndTime)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DtrDayFormSchema>({
    resolver: zodResolver(dtrDaySchema),
    values: dayQuery.data
      ? {
          arrivalTime:
            dayQuery.data.arrivalTime?.slice(0, 5) ??
            (arrivalPrefilled ? dayQuery.data.scheduleStartTime!.slice(0, 5) : undefined),
          departureTime:
            dayQuery.data.departureTime?.slice(0, 5) ??
            (departurePrefilled ? dayQuery.data.scheduleEndTime!.slice(0, 5) : undefined),
          status: dayQuery.data.status,
          reason: dayQuery.data.reason ?? undefined,
          remarks: dayQuery.data.remarks ?? undefined,
        }
      : undefined,
  })

  const scheduleStartTime = dayQuery.data?.scheduleStartTime
  const scheduleEndTime = dayQuery.data?.scheduleEndTime

  // Bug fix: the first version re-shifted Departure from the original schedule duration
  // on *every* Arrival edit, so manually correcting Departure and then fixing a typo in
  // Arrival afterward silently threw the manual Departure edit away. This ref tracks
  // whether the teacher has touched Departure directly; once true, Arrival edits stop
  // auto-shifting it. Resets when navigating to a different day.
  const departureManuallyEditedRef = useRef(false)
  useEffect(() => {
    departureManuallyEditedRef.current = false
  }, [date])

  // ENH-001: editing Arrival shifts Departure by the same amount, keeping the day's
  // scheduled shift *duration* fixed (e.g. schedule 07:00-19:00 → arrival edited to
  // 07:30 → departure follows to 19:30) instead of leaving departure at its old value —
  // but only until the teacher edits Departure directly, at which point their edit wins
  // and further Arrival edits leave it alone (see departureManuallyEditedRef above).
  function handleArrivalTimeChange(event: ChangeEvent<HTMLInputElement>) {
    const newArrivalTime = event.target.value
    if (!newArrivalTime || !scheduleStartTime || !scheduleEndTime) return
    if (departureManuallyEditedRef.current) return
    setValue('departureTime', shiftTimeByScheduleDuration(newArrivalTime, scheduleStartTime, scheduleEndTime), {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  function handleDepartureTimeChange() {
    departureManuallyEditedRef.current = true
  }

  const saveMutation = useMutation({
    mutationFn: (values: DtrDayFormSchema) => updateDtrDay(periodId!, date!, values),
    onSuccess: (updated) => {
      queryClient.setQueryData(['dtr-day', periodId, date], updated)
      void queryClient.invalidateQueries({ queryKey: [...DTR_CALENDAR_QUERY_KEY, periodId] })
    },
  })

  if (!periodId || !date) {
    return <Alert variant="error">Missing DTR period or date.</Alert>
  }

  return (
    <div>
      <div className="mb-4">
        <Link to={`/dtr/${periodId}`} className="text-sm text-sky-600 hover:text-sky-700">
          ← Back to calendar
        </Link>
      </div>

      <PageHeader
        title={`${date} (${dayOfWeekLabel(date)})`}
        description={
          dayQuery.data?.scheduleStartTime
            ? `Scheduled ${formatTime(dayQuery.data.scheduleStartTime)} – ${formatTime(dayQuery.data.scheduleEndTime)}`
            : undefined
        }
      />

      {dayQuery.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {dayQuery.isError && <Alert variant="error">{getErrorMessage(dayQuery.error)}</Alert>}

      {dayQuery.data && (
        <div className="max-w-xl space-y-4">
          {saveMutation.isError && <Alert variant="error">{getErrorMessage(saveMutation.error)}</Alert>}
          {saveMutation.isSuccess && <Alert variant="success">Saved.</Alert>}

          <form
            className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
            onSubmit={(e) => void handleSubmit((values) => saveMutation.mutate(values))(e)}
          >
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Arrival"
                type="time"
                error={errors.arrivalTime?.message}
                hint={arrivalPrefilled ? 'From schedule — confirm or edit' : undefined}
                {...register('arrivalTime', { onChange: handleArrivalTimeChange })}
              />
              <TextField
                label="Departure"
                type="time"
                error={errors.departureTime?.message}
                hint={departurePrefilled ? 'From schedule — confirm or edit' : undefined}
                {...register('departureTime', { onChange: handleDepartureTimeChange })}
              />
            </div>
            <Select label="Status" error={errors.status?.message} {...register('status')}>
              {DTR_DAY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
            <TextField label="Reason (optional)" error={errors.reason?.message} {...register('reason')} />
            <TextArea label="Remarks (optional)" error={errors.remarks?.message} {...register('remarks')} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate(`/dtr/${periodId}`)}>
                Back
              </Button>
              <Button type="submit" isLoading={saveMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
