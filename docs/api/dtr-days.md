# Daily Attendance & Status API

Get or edit a single `DtrDay` — arrival/departure time and/or status/reason/remarks. Both routes take the calendar date as a path param and require `?dtrPeriodId=` as a query param, since a date is only unique *within* a DTR period (a teacher could plausibly have two DTR periods that both cover, say, the 17th — of different months, or in edge cases the same month).

**A day must already exist** — call [`POST /api/dtr/calendar/generate`](./dtr-calendar.md) first. There's no upsert/create path here; `PATCH`ing a date that was never generated (because it had no matching weekly schedule, or the calendar was never generated) 404s.

---

## `GET /api/dtr/days/:date`

Fetch one day.

**Auth:** Bearer JWT required.

**Path param:** `:date` — `YYYY-MM-DD`.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `dtrPeriodId` | **yes** | Which DTR period this date belongs to |

**Success — `200 OK`:** a single `DtrDay` object (same shape as the calendar list — see [`dtr-calendar.md`](./dtr-calendar.md)).

**Errors:**

| Status | Condition |
|---|---|
| `400` | `:date` isn't `YYYY-MM-DD`, or `dtrPeriodId` missing/not a uuid |
| `404` | `dtrPeriodId` doesn't exist/isn't yours, **or** no `DtrDay` exists for that `(dtrPeriodId, date)` pair yet — message: `"DTR day not found — generate the DTR calendar first if this date is expected to be scheduled"` |

---

## `PATCH /api/dtr/days/:date`

Edit arrival/departure and/or status/reason/remarks. All fields optional and independent — send only what changed.

**Auth:** Bearer JWT required.

**Path param:** `:date` — `YYYY-MM-DD`.

**Query params:** `dtrPeriodId` (required, same as `GET`).

**Body:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `arrivalTime` | string | no | 24-hour `"HH:mm"` |
| `departureTime` | string | no | 24-hour `"HH:mm"`; if both `arrivalTime` and `departureTime` are set (whichever combination of newly-submitted vs. already-stored), `arrivalTime` must be earlier |
| `status` | string | no | One of `REGULAR`, `ONLINE`, `SUSPENDED`, `HOLIDAY`, `NO_CLASS`, `OTHER` |
| `reason` | string | no | ≤255 chars, free text |
| `remarks` | string | no | ≤2000 chars, free text |

Example — record a normal day's attendance:
```json
{ "arrivalTime": "07:03", "departureTime": "18:58" }
```

Example — mark a suspension (matches `docs/feature(1).md` §7's worked example exactly):
```json
{ "status": "SUSPENDED", "reason": "Class Suspension", "remarks": "Classes suspended due to weather" }
```

**Success — `200 OK`:** the updated `DtrDay`. `arrivalTime`/`departureTime` come back normalized to `"HH:mm:ss"` regardless of what format you sent, matching what a later `GET` would return.

**Important behavior — no auto-clearing:** changing `status` to a special value (`SUSPENDED`, `ONLINE`, etc.) does **not** clear an already-entered `arrivalTime`/`departureTime`, and vice versa. The API never silently discards data you've entered; if a day should visually read as "blank" for a special status, that's a frontend presentation choice, not something enforced server-side.

**Errors:**

| Status | Condition |
|---|---|
| `400` | Bad time format, invalid `status` value, over-length `reason`/`remarks`, `arrivalTime >= departureTime` (checked against the *merged* result — e.g. `PATCH`ing only `arrivalTime` still validates against the day's already-stored `departureTime`), or a malformed `:date`/`dtrPeriodId` |
| `404` | `dtrPeriodId` doesn't exist/isn't yours, or the day was never generated |

A rejected `PATCH` never partially applies — the row is left exactly as it was before the request.
