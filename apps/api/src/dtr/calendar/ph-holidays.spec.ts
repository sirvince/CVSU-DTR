import { getComputedPhilippineHolidays } from './ph-holidays';

describe('getComputedPhilippineHolidays', () => {
  it('includes the fixed-date holidays for 2026', () => {
    const holidays = getComputedPhilippineHolidays(2026);

    expect(holidays.get('2026-01-01')).toBe("New Year's Day");
    expect(holidays.get('2026-04-09')).toBe('Araw ng Kagitingan');
    expect(holidays.get('2026-05-01')).toBe('Labor Day');
    expect(holidays.get('2026-06-12')).toBe('Independence Day');
    expect(holidays.get('2026-08-21')).toBe('Ninoy Aquino Day');
    expect(holidays.get('2026-11-30')).toBe('Bonifacio Day');
    expect(holidays.get('2026-12-25')).toBe('Christmas Day');
    expect(holidays.get('2026-12-30')).toBe('Rizal Day');
  });

  it('computes National Heroes Day as the last Monday of August', () => {
    // 2026-08-31 is a Monday, so National Heroes Day falls on it exactly.
    const holidays2026 = getComputedPhilippineHolidays(2026);
    expect(holidays2026.get('2026-08-31')).toBe('National Heroes Day');

    // 2025-08-31 is a Sunday, so the last Monday is 2025-08-25.
    const holidays2025 = getComputedPhilippineHolidays(2025);
    expect(holidays2025.get('2025-08-25')).toBe('National Heroes Day');
  });

  it('computes Maundy Thursday and Good Friday from Easter Sunday', () => {
    // Easter Sunday 2026 is 2026-04-05 (verified against the real Nager.Date
    // API response for PH 2026, which independently confirms these dates).
    const holidays = getComputedPhilippineHolidays(2026);
    expect(holidays.get('2026-04-02')).toBe('Maundy Thursday');
    expect(holidays.get('2026-04-03')).toBe('Good Friday');
  });

  it('does not include Islamic holidays (not computable in advance)', () => {
    const holidays = getComputedPhilippineHolidays(2026);
    const names = [...holidays.values()];
    expect(names).not.toContain('Eid al-Fitr');
    expect(names).not.toContain('Eid al-Adha');
  });
});
