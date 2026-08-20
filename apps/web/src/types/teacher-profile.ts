export interface TeacherProfile {
  id: string
  createdAt: string
  updatedAt: string
  userId: string
  employeeId: string
  firstName: string
  middleName?: string
  lastName: string
  position?: string
  department?: string
  campus?: string
}

export interface TeacherProfileFormValues {
  employeeId: string
  firstName: string
  middleName?: string
  lastName: string
  position?: string
  department?: string
  campus?: string
}
