export const DTR_DAY_STATUSES = [
  'REGULAR',
  'ONLINE',
  'SUSPENDED',
  'HOLIDAY',
  'NO_CLASS',
  'OTHER',
] as const

export type DtrDayStatus = (typeof DTR_DAY_STATUSES)[number]

export interface DtrDay {
  id: string
  createdAt: string
  updatedAt: string
  dtrPeriodId: string
  date: string
  scheduleStartTime?: string | null
  scheduleEndTime?: string | null
  arrivalTime?: string | null
  departureTime?: string | null
  status: DtrDayStatus
  reason?: string | null
  remarks?: string | null
}

export interface DtrDayWithWarnings extends DtrDay {
  warnings: string[]
}

export interface UpdateDtrDayValues {
  arrivalTime?: string
  departureTime?: string
  status?: DtrDayStatus
  reason?: string
  remarks?: string
}
