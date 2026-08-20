import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { createMyProfile, fetchMyProfile, PROFILE_QUERY_KEY, updateMyProfile } from '@/api/teacher-profile'
import { teacherProfileSchema, type TeacherProfileFormSchema } from '@/api/teacher-profile-schema'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { TextField } from '@/components/TextField'
import { getErrorMessage } from '@/lib/errors'

export function ProfilePage() {
  const queryClient = useQueryClient()
  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchMyProfile,
    retry: false,
  })

  const profileExists = profileQuery.isSuccess
  const notCreatedYet =
    profileQuery.isError && axios.isAxiosError(profileQuery.error) && profileQuery.error.response?.status === 404

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherProfileFormSchema>({
    resolver: zodResolver(teacherProfileSchema),
    values: profileQuery.data,
  })

  const saveMutation = useMutation({
    mutationFn: (values: TeacherProfileFormSchema) =>
      profileExists ? updateMyProfile(values) : createMyProfile(values),
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, data)
    },
  })

  if (profileQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Teacher Profile" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  if (profileQuery.isError && !notCreatedYet) {
    return (
      <div>
        <PageHeader title="Teacher Profile" />
        <Alert variant="error">{getErrorMessage(profileQuery.error)}</Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Teacher Profile"
        description="Stores the info that goes on your generated DTR — reused across every academic period."
      />

      <div className="max-w-xl space-y-4">
        {notCreatedYet && (
          <Alert variant="info">You haven't created a profile yet — fill this in to get started.</Alert>
        )}
        {saveMutation.isError && <Alert variant="error">{getErrorMessage(saveMutation.error)}</Alert>}
        {saveMutation.isSuccess && <Alert variant="success">Profile saved.</Alert>}

        <form
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
          onSubmit={(e) => void handleSubmit((values) => saveMutation.mutate(values))(e)}
        >
          <TextField label="Employee ID" error={errors.employeeId?.message} {...register('employeeId')} />
          <div className="grid grid-cols-3 gap-3">
            <TextField label="First name" error={errors.firstName?.message} {...register('firstName')} />
            <TextField label="Middle name" error={errors.middleName?.message} {...register('middleName')} />
            <TextField label="Last name" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <TextField label="Position" error={errors.position?.message} {...register('position')} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Department" error={errors.department?.message} {...register('department')} />
            <TextField label="Campus" error={errors.campus?.message} {...register('campus')} />
          </div>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {profileExists ? 'Save changes' : 'Create profile'}
          </Button>
        </form>
      </div>
    </div>
  )
}
