const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// UTC-midnight parsing, same approach as the backend's dtr-calendar.service.ts —
// avoids the local browser timezone shifting a date-only string like
// "2026-08-17" off by one day.
export function dayOfWeekLabel(date: string): string {
  return DAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()]
}

export function formatTime(time?: string | null): string {
  return time ? time.slice(0, 5) : '—'
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(wrapped / 60)
  const minutes = wrapped % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// ENH-001: keeps the day's scheduled shift *duration* fixed when the teacher edits
// Arrival — e.g. schedule 07:00-19:00 (12h), teacher enters 07:30 arrival, this
// returns 19:30 so Departure shifts with it instead of staying at the old default.
export function shiftTimeByScheduleDuration(
  newArrivalTime: string,
  scheduleStartTime: string,
  scheduleEndTime: string,
): string {
  const durationMinutes = timeToMinutes(scheduleEndTime) - timeToMinutes(scheduleStartTime)
  return minutesToTime(timeToMinutes(newArrivalTime) + durationMinutes)
}
