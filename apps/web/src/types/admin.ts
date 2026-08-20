// Matches apps/api's GET /admin/teachers response — UsersService.findAllTeachersWithProfiles()
// explicitly selects these columns only (no passwordHash).
export interface AdminTeacherListItem {
  id: string
  createdAt: string
  updatedAt: string
  email: string
  role: 'TEACHER' | 'ADMIN'
  isActive: boolean
  teacherProfile: {
    id: string
    userId: string
    employeeId: string
    firstName: string
    middleName?: string
    lastName: string
    position?: string
    department?: string
    campus?: string
  } | null
}
