# DTR Validation API

Runs a set of **non-blocking, informational** checks across every day in a DTR period and returns them alongside the day data — a "review before you generate" step (`docs/feature(1).md` §9). Nothing here ever rejects a request or changes data; it's purely read/derive.

This is a different tier from the "hard" input validation already enforced by [`dtr-days.md`](./dtr-days.md) (`arrivalTime < departureTime`, valid time format, valid status enum) — those reject bad writes outright and never reach this endpoint at all, since invalid data can never be persisted in the first place. What this endpoint flags are things that are *valid* data but might be worth a second look — a late arrival, a day nobody's filled in yet.

**Only `REGULAR`-status days are checked.** A `SUSPENDED`/`HOLIDAY`/`ONLINE`/`NO_CLASS`/`OTHER` day's blank Arrival/Departure is expected, not a problem to flag — this system deliberately never second-guesses whether a special-status marking itself is correct (per BR-007/BR-008 — see `CLAUDE.md`).

---

## `POST /api/dtr/validate`

**Auth:** Bearer JWT required.

**Body:**

```json
{ "dtrPeriodId": "c7bd758f-c626-43f5-bd25-b5804eb02529" }
```

**Success — `201 Created`:** **every** day in the period (not just the ones with warnings), each `DtrDay` object with a `warnings` array appended:

```json
{
  "success": true,
  "data": [
    { "date": "2026-08-17", "status": "REGULAR", "arrivalTime": "07:00:00", "departureTime": "19:00:00", "warnings": [] },
    { "date": "2026-08-19", "status": "REGULAR", "arrivalTime": "07:35:00", "departureTime": "18:00:00",
      "warnings": ["Arrival is later than scheduled start.", "Departure is earlier than scheduled end."] },
    { "date": "2026-08-21", "status": "SUSPENDED", "arrivalTime": null, "departureTime": null, "warnings": [] }
  ],
  "message": "Success"
}
```
*(each object also has the full `DtrDay` fields — `id`, `dtrPeriodId`, `scheduleStartTime`, `scheduleEndTime`, `reason`, `remarks`, timestamps — trimmed above for brevity)*

**Warnings that can appear, and exactly when (REGULAR days only):**

| Warning | Fires when |
|---|---|
| `"Missing Arrival"` | `arrivalTime` is blank — independent of whether `departureTime` is set |
| `"Missing Departure"` | `departureTime` is blank — independent of whether `arrivalTime` is set |
| `"Arrival is later than scheduled start."` | `arrivalTime` is set and later than `scheduleStartTime` |
| `"Departure is earlier than scheduled end."` | `departureTime` is set and earlier than `scheduleEndTime` |

A single day can carry multiple warnings at once (e.g. both late-arrival and early-departure, as shown above). There is no "Invalid Time" warning — it's structurally unreachable, since [`dtr-days.md`](./dtr-days.md)'s write-time validation makes it impossible to ever persist a malformed time.

**Errors:**

| Status | Condition |
|---|---|
| `400` | `dtrPeriodId` missing or not a valid uuid |
| `404` | `dtrPeriodId` doesn't exist or isn't yours |
