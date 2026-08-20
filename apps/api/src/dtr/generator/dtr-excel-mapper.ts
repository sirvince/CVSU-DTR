import { BadRequestException } from '@nestjs/common';
import type { Worksheet } from 'exceljs';
import { DtrDayStatus } from '../../common/enums/dtr-day-status.enum';
import { TeacherProfile } from '../../teachers/entities/teacher-profile.entity';
import { DtrDay } from '../days/entities/dtr-day.entity';
import { DtrPeriod } from '../periods/entities/dtr-period.entity';

// Cell map for storage/templates/dtr/DTR-FORMAT-MASTER.xlsx, sheet "DTR"
// (Civil Service Form No. 48 layout, derived from a real filled-in export via
// scripts/build-master-template.js — see that script's header for provenance).
// If the official template ever changes, update these constants and
// scripts/build-master-template.js together; nothing else in the codebase
// knows about specific cell addresses.
const NAME_CELL = 'D6'; // merged D6:J6
const PERIOD_LABEL_CELL = 'H9';
const FIRST_DAY_ROW = 17; // day 1
const LAST_DAY_ROW = 47; // day 31
const SHIFT_NOTE_COLUMN = 'B'; // merged B{row}:C{row} per day row, immediately
// left of the Day column (D) — unused by the AM/PM Arrival/Departure grid, so
// it's repurposed as a free-text annotation slot. A REGULAR day writes its
// scheduled shift here (e.g. "7-7" for a 07:00-19:00 schedule) as a quick
// reference next to the day number; a non-REGULAR day writes its status (+
// reason, if any) instead — the two never both apply to the same row, since
// a day either has a schedule-derived note or a status note, never both.
const AM_ARRIVAL_COLUMN = 'E';
const AM_DEPARTURE_COLUMN = 'F';
const PM_ARRIVAL_COLUMN = 'G';
const PM_DEPARTURE_COLUMN = 'H';
// The printed form has 4 punch columns (AM IN/AM OUT/PM IN/PM OUT) for the
// classic 4-punch workflow, but this system's data model only has one Arrival
// + one Departure per day (docs/plan(1).md §4). Rather than always writing
// Arrival to the AM column and Departure to the PM column, each time is
// placed by its actual clock hour — an afternoon Arrival (e.g. a PM-only
// shift) goes in "PM Arrival" (G), and a before-noon Departure (e.g. a half
// day) goes in "AM Departure" (F) — so the printed grid reads correctly
// regardless of which half of the day a day's single Arrival/Departure falls
// in. Bug found in live testing: the original version always used E/H,
// which put an afternoon arrival in the AM column and a morning departure in
// the PM column.

const EXCEL_TIME_EPOCH = { year: 1899, month: 11, day: 30 }; // Excel's zero date

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatTeacherName(profile: TeacherProfile): string {
  const middle = profile.middleName
    ? ` ${profile.middleName.trim().toUpperCase()}`
    : '';
  return `${profile.lastName.trim().toUpperCase()}, ${profile.firstName.trim().toUpperCase()}${middle}`;
}

// The template is a single calendar month grid (31 day-rows) — a DTR period
// spanning two months has nowhere to put the second month's days, so this is
// a hard limitation of the paper-form layout itself, not an app restriction.
export function assertSingleCalendarMonth(period: DtrPeriod): void {
  const start = new Date(`${period.startDate}T00:00:00Z`);
  const end = new Date(`${period.endDate}T00:00:00Z`);
  if (
    start.getUTCFullYear() !== end.getUTCFullYear() ||
    start.getUTCMonth() !== end.getUTCMonth()
  ) {
    throw new BadRequestException(
      'DTR period must fall within a single calendar month to generate the Excel form',
    );
  }
}

export function formatPeriodLabel(period: DtrPeriod): string {
  const start = new Date(`${period.startDate}T00:00:00Z`);
  const end = new Date(`${period.endDate}T00:00:00Z`);
  const monthName = MONTH_NAMES[start.getUTCMonth()];
  return `${monthName} ${start.getUTCDate()}-${end.getUTCDate()}, ${start.getUTCFullYear()}`;
}

export function buildFileName(
  profile: TeacherProfile,
  period: DtrPeriod,
): string {
  const start = new Date(`${period.startDate}T00:00:00Z`);
  const end = new Date(`${period.endDate}T00:00:00Z`);
  const monthAbbrev = MONTH_NAMES[start.getUTCMonth()]
    .slice(0, 3)
    .toUpperCase();
  const middle = profile.middleName
    ? `-${sanitizeNamePart(profile.middleName)}`
    : '';
  return (
    `DTR_${sanitizeNamePart(profile.lastName)}_${sanitizeNamePart(profile.firstName)}` +
    `${middle}_${monthAbbrev}-${start.getUTCDate()}-${end.getUTCDate()}-${start.getUTCFullYear()}.xlsx`
  );
}

function sanitizeNamePart(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Noon (12:00:00) and later counts as afternoon, matching the printed form's
// AM/PM split and how a teacher would naturally read "12pm" as PM.
function isAfternoon(hhmmss: string): boolean {
  const hour = Number(hhmmss.slice(0, 2));
  return hour >= 12;
}

// "07:00:00" -> "7", "19:00:00" -> "7", "07:30:00" -> "7:30" — 12-hour clock
// hour, no AM/PM suffix (the shift-note column is a compact reference next to
// the day number, not a full time display; AM_ARRIVAL_COLUMN etc. already show
// the exact times), minutes included only when not on the hour.
function formatScheduleHour(hhmmss: string): string {
  const [hour24, minute] = hhmmss.split(':').map(Number);
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return minute === 0
    ? `${hour12}`
    : `${hour12}:${String(minute).padStart(2, '0')}`;
}

function formatScheduleShorthand(
  scheduleStartTime: string,
  scheduleEndTime: string,
): string {
  return `${formatScheduleHour(scheduleStartTime)}-${formatScheduleHour(scheduleEndTime)}`;
}

function toExcelTime(hhmmss: string): Date {
  const [hour, minute] = hhmmss.split(':').map(Number);
  return new Date(
    Date.UTC(
      EXCEL_TIME_EPOCH.year,
      EXCEL_TIME_EPOCH.month,
      EXCEL_TIME_EPOCH.day,
      hour,
      minute,
    ),
  );
}

const FORMULA_TRIGGER_PATTERN = /^[=+\-@\t\r]/;

// Security: mitigates Excel/CSV formula injection (CWE-1236). Teacher name,
// DTR period label, and status reason are free text that flows straight into
// cell values, and this workbook is explicitly built to be opened by someone
// else (HR) — a value starting with =, +, -, @, or a tab/CR can be
// interpreted as a live formula by some spreadsheet applications on open
// (e.g. a last name of `=HYPERLINK("http://evil.example","Click")`), turning
// an official document into a phishing/exfil vector. Prefixing a leading
// apostrophe is the standard mitigation — it forces the cell to render as
// literal text everywhere, at the cost of that apostrophe becoming visible
// for the rare legitimate value that happens to start with one of these
// characters, which is an acceptable trade for never silently executing a
// formula.
function sanitizeForExcel(value: string): string {
  return FORMULA_TRIGGER_PATTERN.test(value) ? `'${value}` : value;
}

function dayRowFor(date: string): number {
  const dayOfMonth = new Date(`${date}T00:00:00Z`).getUTCDate();
  const row = FIRST_DAY_ROW + dayOfMonth - 1;
  if (row < FIRST_DAY_ROW || row > LAST_DAY_ROW) {
    throw new BadRequestException(
      `Date ${date} has no row in the DTR template`,
    );
  }
  return row;
}

export function populateDtrSheet(
  sheet: Worksheet,
  profile: TeacherProfile,
  period: DtrPeriod,
  days: DtrDay[],
): void {
  sheet.getCell(NAME_CELL).value = sanitizeForExcel(formatTeacherName(profile));
  sheet.getCell(PERIOD_LABEL_CELL).value = sanitizeForExcel(
    period.label?.trim() || formatPeriodLabel(period),
  );

  for (const day of days) {
    const row = dayRowFor(day.date);

    if (day.arrivalTime) {
      const arrivalColumn = isAfternoon(day.arrivalTime)
        ? PM_ARRIVAL_COLUMN
        : AM_ARRIVAL_COLUMN;
      sheet.getCell(`${arrivalColumn}${row}`).value = toExcelTime(
        day.arrivalTime,
      );
    }
    if (day.departureTime) {
      const departureColumn = isAfternoon(day.departureTime)
        ? PM_DEPARTURE_COLUMN
        : AM_DEPARTURE_COLUMN;
      sheet.getCell(`${departureColumn}${row}`).value = toExcelTime(
        day.departureTime,
      );
    }
    if (day.status !== DtrDayStatus.REGULAR) {
      sheet.getCell(`${SHIFT_NOTE_COLUMN}${row}`).value = sanitizeForExcel(
        day.reason ? `${day.status} - ${day.reason}` : day.status,
      );
    } else if (day.scheduleStartTime && day.scheduleEndTime) {
      sheet.getCell(`${SHIFT_NOTE_COLUMN}${row}`).value =
        formatScheduleShorthand(day.scheduleStartTime, day.scheduleEndTime);
    }
  }
}
