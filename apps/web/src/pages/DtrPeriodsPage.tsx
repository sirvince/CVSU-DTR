import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { ACADEMIC_PERIODS_QUERY_KEY, fetchAcademicPeriods } from '@/api/academic-periods'
import { dtrPeriodSchema, type DtrPeriodFormSchema } from '@/api/dtr-period-schema'
import {
  createDtrPeriod,
  deleteDtrPeriod,
  DTR_PERIODS_QUERY_KEY,
  fetchDtrPeriods,
  updateDtrPeriod,
} from '@/api/dtr-periods'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { Select } from '@/components/Select'
import { TextField } from '@/components/TextField'
import { getErrorMessage } from '@/lib/errors'
import type { DtrPeriod } from '@/types/dtr-period'

export function DtrPeriodsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<DtrPeriod | 'new' | null>(null)

  const periodsQuery = useQuery({
    queryKey: DTR_PERIODS_QUERY_KEY,
    queryFn: () => fetchDtrPeriods(),
  })
  const academicPeriodsQuery = useQuery({
    queryKey: ACADEMIC_PERIODS_QUERY_KEY,
    queryFn: fetchAcademicPeriods,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDtrPeriod,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DTR_PERIODS_QUERY_KEY })
    },
  })

  function handleDelete(period: DtrPeriod) {
    if (window.confirm(`Delete the DTR period ${period.startDate} – ${period.endDate}?`)) {
      deleteMutation.mutate(period.id)
    }
  }

  const hasAcademicPeriods = (academicPeriodsQuery.data?.length ?? 0) > 0

  return (
    <div>
      <PageHeader
        title="DTR Periods"
        description="The specific date range you're preparing a DTR for — e.g. August 16–31."
      />

      {academicPeriodsQuery.data && !hasAcademicPeriods && (
        <Alert variant="info">
          You need an academic period before you can create a DTR period — create one on the
          Academic Periods page first.
        </Alert>
      )}

      <div className="mb-4 mt-4">
        <Button onClick={() => setEditing('new')} disabled={!hasAcademicPeriods}>
          Add DTR period
        </Button>
      </div>

      {periodsQuery.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {periodsQuery.isError && <Alert variant="error">{getErrorMessage(periodsQuery.error)}</Alert>}
      {deleteMutation.isError && <Alert variant="error">{getErrorMessage(deleteMutation.error)}</Alert>}

      {periodsQuery.data && periodsQuery.data.length === 0 && hasAcademicPeriods && (
        <p className="text-sm text-slate-500">No DTR periods yet — add one to get started.</p>
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
                    <div className="flex justify-end gap-2">
                      <Link to={`/dtr/${period.id}`}>
                        <Button variant="secondary">Open</Button>
                      </Link>
                      <Button variant="secondary" onClick={() => setEditing(period)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(period)}
                        isLoading={deleteMutation.isPending && deleteMutation.variables === period.id}
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

      {editing && <DtrPeriodFormModal period={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function DtrPeriodFormModal({ period, onClose }: { period?: DtrPeriod; onClose: () => void }) {
  const queryClient = useQueryClient()
  const academicPeriodsQuery = useQuery({
    queryKey: ACADEMIC_PERIODS_QUERY_KEY,
    queryFn: fetchAcademicPeriods,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DtrPeriodFormSchema>({
    resolver: zodResolver(dtrPeriodSchema),
    defaultValues: period
      ? {
          academicPeriodId: period.academicPeriodId,
          startDate: period.startDate,
          endDate: period.endDate,
          label: period.label ?? undefined,
        }
      : { academicPeriodId: academicPeriodsQuery.data?.[0]?.id ?? '' },
  })

  const saveMutation = useMutation({
    mutationFn: (values: DtrPeriodFormSchema) =>
      period ? updateDtrPeriod(period.id, values) : createDtrPeriod(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DTR_PERIODS_QUERY_KEY })
      onClose()
    },
  })

  return (
    <Modal title={period ? 'Edit DTR period' : 'Add DTR period'} onClose={onClose}>
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
          {academicPeriodsQuery.data?.map((ap) => (
            <option key={ap.id} value={ap.id}>
              {ap.academicYear} — {ap.semester}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <TextField
            label="End date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>
        <TextField
          label="Label (optional)"
          placeholder="August 16-31"
          error={errors.label?.message}
          {...register('label')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {period ? 'Save changes' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
