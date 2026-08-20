import { PhHolidaysService } from './ph-holidays.service';

describe('PhHolidaysService', () => {
  let service: PhHolidaysService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new PhHolidaysService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('uses the Nager.Date API response, preferring the English name over localName', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            date: '2026-01-01',
            localName: 'Bagong Taon',
            name: "New Year's Day",
          },
          {
            date: '2026-08-21',
            localName: 'Araw ni Ninoy Aquino',
            name: 'Ninoy Aquino Day',
          },
        ]),
    });

    const holidays = await service.getHolidays(2026);

    expect(holidays.get('2026-01-01')).toBe("New Year's Day");
    expect(holidays.get('2026-08-21')).toBe('Ninoy Aquino Day');
  });

  it('falls back to the computed list when the API responds with a non-2xx status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    const holidays = await service.getHolidays(2026);

    // Falls back to ph-holidays.ts's computed list, which does include this.
    expect(holidays.get('2026-06-12')).toBe('Independence Day');
  });

  it('falls back to the computed list when the fetch itself throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const holidays = await service.getHolidays(2026);

    expect(holidays.get('2026-06-12')).toBe('Independence Day');
  });

  it('caches per year — a second call for the same year does not fetch again', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { date: '2026-01-01', localName: 'x', name: "New Year's Day" },
        ]),
    });
    global.fetch = fetchMock;

    await service.getHolidays(2026);
    await service.getHolidays(2026);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
