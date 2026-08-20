export interface AcademicPeriod {
  id: string
  createdAt: string
  updatedAt: string
  teacherId: string
  academicYear: string
  semester: string
  startDate: string
  endDate: string
}

export interface AcademicPeriodFormValues {
  academicYear: string
  semester: string
  startDate: string
  endDate: string
}
