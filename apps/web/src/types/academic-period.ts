// Shared, admin-managed resource — every teacher reads the same list.
// createdByUserId is audit-only (which admin created it), not an ownership
// field, and can be null for rows that predate this field.
export interface AcademicPeriod {
  id: string
  createdAt: string
  updatedAt: string
  createdByUserId: string | null
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
