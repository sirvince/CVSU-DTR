export interface DtrPeriod {
  id: string
  createdAt: string
  updatedAt: string
  teacherId: string
  academicPeriodId: string
  startDate: string
  endDate: string
  label?: string | null
}

export interface DtrPeriodFormValues {
  academicPeriodId: string
  startDate: string
  endDate: string
  label?: string
}
