import { Injectable, Logger } from '@nestjs/common';
import { getComputedPhilippineHolidays } from './ph-holidays';

const NAGER_API_BASE = 'https://date.nager.at/api/v3/PublicHolidays';
const FETCH_TIMEOUT_MS = 5000;

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
}

// Wraps the Nager.Date public holiday API (https://date.nager.at — free,
// no API key) as the source of truth for Philippine holidays, with the
// hardcoded computation in ph-holidays.ts as an offline fallback. Cached
// per-year in memory for this process's lifetime — a DTR calendar
// generation call never needs "today's" holiday list to be fresher than
// that, and it avoids hitting the external API on every single generate()
// call for periods spanning the same year.
@Injectable()
export class PhHolidaysService {
  private readonly logger = new Logger(PhHolidaysService.name);
  private readonly cache = new Map<number, Map<string, string>>();

  async getHolidays(year: number): Promise<Map<string, string>> {
    const cached = this.cache.get(year);
    if (cached) {
      return cached;
    }

    const holidays =
      (await this.fetchFromApi(year)) ?? getComputedPhilippineHolidays(year);
    this.cache.set(year, holidays);
    return holidays;
  }

  private async fetchFromApi(
    year: number,
  ): Promise<Map<string, string> | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(`${NAGER_API_BASE}/${year}/PH`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        this.logger.warn(
          `Nager.Date API returned ${response.status} for year ${year} — falling back to the built-in computed holiday list`,
        );
        return null;
      }
      const data = (await response.json()) as NagerHoliday[];
      // English name, not localName (e.g. "New Year's Day" not "Bagong
      // Taon") — this ends up in the DtrDay.reason field, which the Excel
      // generator prints on the official form (dtr-excel-mapper.ts), and
      // every other status/label in this app is already English.
      const holidays = new Map<string, string>();
      for (const holiday of data) {
        holidays.set(holiday.date, holiday.name);
      }
      return holidays;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch PH holidays for ${year} from Nager.Date — falling back to the built-in computed holiday list: ${(error as Error).message}`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
