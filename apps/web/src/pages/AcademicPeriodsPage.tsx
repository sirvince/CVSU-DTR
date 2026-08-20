import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  ACADEMIC_PERIODS_QUERY_KEY,
  createAcademicPeriod,
  deleteAcademicPeriod,
  fetchAcademicPeriods,
  updateAcademicPeriod,
} from '@/api/academic-periods'
import { academicPeriodSchema, type AcademicPeriodFormSchema } from '@/api/academic-period-schema'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { TextField } from '@/components/TextField'
import { getErrorMessage } from '@/lib/errors'
import type { AcademicPeriod } from '@/types/academic-period'

export function AcademicPeriodsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AcademicPeriod | 'new' | null>(null)

  const periodsQuery = useQuery({
    queryKey: ACADEMIC_PERIODS_QUERY_KEY,
    queryFn: fetchAcademicPeriods,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAcademicPeriod,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACADEMIC_PERIODS_QUERY_KEY })
    },
  })

  function handleDelete(period: AcademicPeriod) {
    if (window.confirm(`Delete ${period.academicYear} — ${period.semester}?`)) {
      deleteMutation.mutate(period.id)
    }
  }

  return (
    <div>
      <PageHeader
        title="Academic Periods"
        description="Broad time ranges your weekly schedule and DTR periods belong to."
      />

      <div className="mb-4">
        <Button onClick={() => setEditing('new')}>Add academic period</Button>
      </div>

      {periodsQuery.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {periodsQuery.isError && <Alert variant="error">{getErrorMessage(periodsQuery.error)}</Alert>}
      {deleteMutation.isError && <Alert variant="error">{getErrorMessage(deleteMutation.error)}</Alert>}

      {periodsQuery.data && periodsQuery.data.length === 0 && (
        <p className="text-sm text-slate-500">No academic periods yet — add one to get started.</p>
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
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {periodsQuery.data.map((period) => (
                <tr key={period.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{period.academicYear}</td>
                  <td className="px-4 py-2">{period.semester}</td>
                  <td className="px-4 py-2">{period.startDate}</td>
                  <td className="px-4 py-2">{period.endDate}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
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

      {editing && <AcademicPeriodFormModal period={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function AcademicPeriodFormModal({
  period,
  onClose,
}: {
  period?: AcademicPeriod
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcademicPeriodFormSchema>({
    resolver: zodResolver(academicPeriodSchema),
    defaultValues: period
      ? {
          academicYear: period.academicYear,
          semester: period.semester,
          startDate: period.startDate,
          endDate: period.endDate,
        }
      : undefined,
  })

  const saveMutation = useMutation({
    mutationFn: (values: AcademicPeriodFormSchema) =>
      period ? updateAcademicPeriod(period.id, values) : createAcademicPeriod(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACADEMIC_PERIODS_QUERY_KEY })
      onClose()
    },
  })

  return (
    <Modal title={period ? 'Edit academic period' : 'Add academic period'} onClose={onClose}>
      {saveMutation.isError && <Alert variant="error">{getErrorMessage(saveMutation.error)}</Alert>}
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => void handleSubmit((values) => saveMutation.mutate(values))(e)}
      >
        <TextField
          label="Academic year"
          placeholder="2026-2027"
          error={errors.academicYear?.message}
          {...register('academicYear')}
        />
        <TextField
          label="Semester"
          placeholder="1st Semester"
          error={errors.semester?.message}
          {...register('semester')}
        />
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
