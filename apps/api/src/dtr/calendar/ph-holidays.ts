// Confirmed exception to BR-008 ("the system must not... auto-declare
// suspensions/holidays") — explicitly requested by the user (same pattern
// as ENH-001's BR-004 exception in dtr-calendar.service.ts: narrow,
// confirmed, and fully editable afterward, never a silent default).
//
// This is the OFFLINE FALLBACK — ph-holidays.service.ts's PhHolidaysService
// is what generate() actually calls; it fetches the real official list from
// the Nager.Date public API (https://date.nager.at) and only falls back to
// this hardcoded computation if that request fails (network issue, API
// down, rate limit). Nager.Date's data can include holidays this file
// cannot (Eid'l Fitr, Eid'l Adha, ad-hoc special days added by a given
// year's proclamation) — this fallback is deliberately limited to holidays
// whose date can be computed years in advance with no risk of being wrong:
// fixed calendar dates, one day-of-week rule (National Heroes Day), and
// Easter-derived dates (Maundy Thursday / Good Friday). It does NOT include
// Islamic holidays (lunar Hijri calendar, proclaimed close to the date) or
// ad-hoc special days — those are only available when the API call
// succeeds.
//
// A teacher can always remove or edit a day this auto-creates regardless of
// which source produced it (see DtrDaysService.remove/update).
export function getComputedPhilippineHolidays(
  year: number,
): Map<string, string> {
  const holidays = new Map<string, string>();

  const add = (month: number, day: number, name: string) => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    holidays.set(date, name);
  };

  // Fixed-date regular holidays.
  add(1, 1, "New Year's Day");
  add(4, 9, 'Araw ng Kagitingan');
  add(5, 1, 'Labor Day');
  add(6, 12, 'Independence Day');
  add(11, 30, 'Bonifacio Day');
  add(12, 25, 'Christmas Day');
  add(12, 30, 'Rizal Day');

  // Commonly-recurring special (non-working) days with fixed dates.
  add(2, 25, 'EDSA People Power Anniversary');
  add(8, 21, 'Ninoy Aquino Day');
  add(11, 1, "All Saints' Day");
  add(12, 8, 'Feast of the Immaculate Conception');
  add(12, 31, 'Last Day of the Year');

  // National Heroes Day — last Monday of August.
  const lastDayOfAugust = new Date(Date.UTC(year, 7, 31));
  const daysAfterMonday = (lastDayOfAugust.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  const lastMonday = new Date(Date.UTC(year, 7, 31 - daysAfterMonday));
  add(8, lastMonday.getUTCDate(), 'National Heroes Day');

  // Maundy Thursday / Good Friday — 3 and 2 days before Easter Sunday.
  const easter = computeEasterSunday(year);
  const maundyThursday = new Date(easter.getTime() - 3 * 86_400_000);
  const goodFriday = new Date(easter.getTime() - 2 * 86_400_000);
  add(
    maundyThursday.getUTCMonth() + 1,
    maundyThursday.getUTCDate(),
    'Maundy Thursday',
  );
  add(goodFriday.getUTCMonth() + 1, goodFriday.getUTCDate(), 'Good Friday');

  return holidays;
}

// Anonymous Gregorian algorithm (Meeus/Jones/Butcher) — correct for any
// Gregorian-calendar year, which covers every year this app will ever run
// generation for.
function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}
