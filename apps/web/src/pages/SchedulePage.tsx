import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ACADEMIC_PERIODS_QUERY_KEY, fetchAcademicPeriods } from '@/api/academic-periods'
import { scheduleSchema, type ScheduleFormSchema } from '@/api/schedule-schema'
import {
  createSchedule,
  deleteSchedule,
  fetchSchedules,
  SCHEDULES_QUERY_KEY,
  updateSchedule,
} from '@/api/schedules'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { Select } from '@/components/Select'
import { TextField } from '@/components/TextField'
import { getErrorMessage } from '@/lib/errors'
import { DAYS_OF_WEEK, type TeacherSchedule } from '@/types/schedule'

export function SchedulePage() {
  const queryClient = useQueryClient()
  const [academicPeriodId, setAcademicPeriodId] = useState<string>('')
  const [editing, setEditing] = useState<TeacherSchedule | 'new' | null>(null)

  const periodsQuery = useQuery({
    queryKey: ACADEMIC_PERIODS_QUERY_KEY,
    queryFn: fetchAcademicPeriods,
  })

  // Default to the first (newest) academic period once periods load.
  useEffect(() => {
    if (!academicPeriodId && periodsQuery.data && periodsQuery.data.length > 0) {
      setAcademicPeriodId(periodsQuery.data[0].id)
    }
  }, [academicPeriodId, periodsQuery.data])

  const schedulesQuery = useQuery({
    queryKey: [...SCHEDULES_QUERY_KEY, academicPeriodId],
    queryFn: () => fetchSchedules(academicPeriodId),
    enabled: Boolean(academicPeriodId),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY })
    },
  })

  function handleDelete(schedule: TeacherSchedule) {
    if (window.confirm(`Delete the ${schedule.dayOfWeek} schedule?`)) {
      deleteMutation.mutate(schedule.id)
    }
  }

  if (periodsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Weekly Schedule" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  if (periodsQuery.data && periodsQuery.data.length === 0) {
    return (
      <div>
        <PageHeader title="Weekly Schedule" />
        <Alert variant="info">
          You need an academic period before you can configure a schedule — create one on the
          Academic Periods page first.
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Weekly Schedule"
        description="Your expected duty window per day of week — never automatically copied into actual attendance."
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="w-64">
          <Select
            label="Academic period"
            value={academicPeriodId}
            onChange={(e) => setAcademicPeriodId(e.target.value)}
          >
            {periodsQuery.data?.map((period) => (
              <option key={period.id} value={period.id}>
                {period.academicYear} — {period.semester}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => setEditing('new')} disabled={!academicPeriodId}>
          Add schedule
        </Button>
      </div>

      {schedulesQuery.isError && <Alert variant="error">{getErrorMessage(schedulesQuery.error)}</Alert>}
      {deleteMutation.isError && <Alert variant="error">{getErrorMessage(deleteMutation.error)}</Alert>}

      {schedulesQuery.data && schedulesQuery.data.length === 0 && (
        <p className="text-sm text-slate-500">No schedule configured for this academic period yet.</p>
      )}

      {schedulesQuery.data && schedulesQuery.data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-4 py-2 font-medium">Start</th>
                <th className="px-4 py-2 font-medium">End</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {schedulesQuery.data.map((schedule) => (
                <tr key={schedule.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{schedule.dayOfWeek}</td>
                  <td className="px-4 py-2">{schedule.startTime.slice(0, 5)}</td>
                  <td className="px-4 py-2">{schedule.endTime.slice(0, 5)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditing(schedule)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(schedule)}
                        isLoading={deleteMutation.isPending && deleteMutation.variables === schedule.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ScheduleFormModal
          schedule={editing === 'new' ? undefined : editing}
          defaultAcademicPeriodId={academicPeriodId}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function ScheduleFormModal({
  schedule,
  defaultAcademicPeriodId,
  onClose,
}: {
  schedule?: TeacherSchedule
  defaultAcademicPeriodId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const periodsQuery = useQuery({
    queryKey: ACADEMIC_PERIODS_QUERY_KEY,
    queryFn: fetchAcademicPeriods,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleFormSchema>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: schedule
      ? {
          academicPeriodId: schedule.academicPeriodId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime.slice(0, 5),
          endTime: schedule.endTime.slice(0, 5),
        }
      : {
          academicPeriodId: defaultAcademicPeriodId,
          dayOfWeek: 'MONDAY',
          startTime: '07:00',
          endTime: '19:00',
        },
  })

  const saveMutation = useMutation({
    mutationFn: (values: ScheduleFormSchema) =>
      schedule ? updateSchedule(schedule.id, values) : createSchedule(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY })
      onClose()
    },
  })

  return (
    <Modal title={schedule ? 'Edit schedule' : 'Add schedule'} onClose={onClose}>
      {saveMutation.isError && <Alert variant="error">{getErrorMessage(saveMutation.error)}</Alert>}
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => void handleSubmit((values) => saveMutation.mutate(values))(e)}
      >
        <Select
          label="Academic period"
          error={errors.academicPeriodId?.message}
          {...register('academicPeriodId')}
        >
          {periodsQuery.data?.map((period) => (
            <option key={period.id} value={period.id}>
              {period.academicYear} — {period.semester}
            </option>
          ))}
        </Select>
        <Select label="Day of week" error={errors.dayOfWeek?.message} {...register('dayOfWeek')}>
          {DAYS_OF_WEEK.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Start time"
            type="time"
            error={errors.startTime?.message}
            {...register('startTime')}
          />
          <TextField
            label="End time"
            type="time"
            error={errors.endTime?.message}
            {...register('endTime')}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {schedule ? 'Save changes' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
