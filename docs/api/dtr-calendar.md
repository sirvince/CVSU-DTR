# DTR Calendar API

This is where a [DTR period](./dtr-periods.md) and your [weekly schedule](./schedules.md) turn into actual per-day records ("DTR days") you can enter attendance against. **A date only gets a DTR day if it has a matching weekly schedule** — weekends and any day-of-week you haven't scheduled are silently skipped, matching `docs/feature(1).md` §5's example (only Mon–Fri rows appear, no weekend rows).

You must call `POST .../generate` before a date exists to [`GET`/`PATCH` in `dtr-days.md`](./dtr-days.md) — there's no implicit creation from the day-editing endpoints.

---

## `GET /api/dtr/calendar`

List the DTR days already generated for a period. **Read-only — does not generate anything.**

**Auth:** Bearer JWT required.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `dtrPeriodId` | **yes** | Which DTR period to list days for |

**Success — `200 OK`:** array of `DtrDay` objects, ordered by date:

```json
{
  "success": true,
  "data": [
    {
      "id": "f9ce1a5a-02ff-4957-99a3-a7a7b3bde178",
      "createdAt": "2026-08-17T10:42:32.424Z",
      "updatedAt": "2026-08-17T10:42:32.424Z",
      "dtrPeriodId": "c7bd758f-c626-43f5-bd25-b5804eb02529",
      "date": "2026-08-17",
      "scheduleStartTime": "07:00:00",
      "scheduleEndTime": "19:00:00",
      "arrivalTime": "07:00:00",
      "departureTime": "19:00:00",
      "status": "REGULAR",
      "reason": null,
      "remarks": null
    }
  ],
  "message": "Success"
}
```

Empty array if the calendar hasn't been generated yet (or the period has no matching schedule days).

**Errors:**

| Status | Condition |
|---|---|
| `400` | `dtrPeriodId` missing or not a valid uuid |
| `404` | `dtrPeriodId` doesn't exist or isn't yours |

---

## `POST /api/dtr/calendar/generate`

Materialize DTR day rows for every scheduled date in the period. **Idempotent and additive-only** — safe to call repeatedly.

**Auth:** Bearer JWT required.

**Body:**

```json
{ "dtrPeriodId": "c7bd758f-c626-43f5-bd25-b5804eb02529" }
```

**Success — `201 Created`:** the full `DtrDay[]` for the period after generating (same shape as `GET`, above).

**What it does, precisely:**
1. Looks up your weekly schedule for the DTR period's academic period.
2. For every date from the period's `startDate` to `endDate`, checks whether that date's day-of-week has a matching schedule entry.
   - **No match** → skipped, no row created.
   - **Match, and no row exists yet for that date** → a new `DtrDay` row is created, snapshotting that schedule's `startTime`/`endTime` into `scheduleStartTime`/`scheduleEndTime`, with `status: REGULAR`, and `arrivalTime`/`departureTime` **auto-filled from that same schedule** (ENH-001 — a confirmed, deliberate exception to BR-004's "schedule must never automatically become attendance": both fields are fully editable afterward via `PATCH /api/dtr/days/:date`, this only sets the starting value once, at row-creation time).
   - **Match, but a row already exists for that date** → **left completely untouched.** This is deliberate: regenerating after you've already entered attendance, changed the status, or added remarks will never overwrite that data, and deleting the underlying schedule afterward won't retroactively remove or alter days already generated from it.

Because of that last point, calling this endpoint again after adding a new weekly-schedule day will add rows for the *newly*-covered dates without touching anything else; calling it again with no schedule changes is a true no-op (same rows, same ids).

**Errors:**

| Status | Condition |
|---|---|
| `400` | `dtrPeriodId` missing or not a valid uuid |
| `404` | `dtrPeriodId` doesn't exist or isn't yours |

There is no endpoint to remove a stale `DtrDay` (e.g. after deleting the schedule that produced it) — this is a known open gap, not an oversight.
