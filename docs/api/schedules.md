# Weekly Schedules API

A schedule is one **expected duty window** for one day of the week within one academic period (e.g. "Monday, 07:00–19:00"). This is the *expected* schedule, not actual attendance — schedules never automatically become [DTR day](./dtr-days.md) attendance records; they're only used to determine which dates get a DTR row when the [calendar is generated](./dtr-calendar.md).

A teacher may have **at most one schedule per day-of-week per academic period** (enforced by a DB constraint) — this is what the docs call "prevent accidental duplicates" (`docs/ticket-base-detailed.md`'s DTR-005 example). The MVP does not support multiple time ranges on the same day.

---

## `GET /api/schedules`

List your own schedules, ordered by day of week (Monday → Sunday).

**Auth:** Bearer JWT required.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `academicPeriodId` | no | Filter to schedules within one academic period |

**Success — `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "325a8b25-0ef8-482d-b3e7-6bdfe7f92707",
      "createdAt": "2026-08-17T10:27:16.274Z",
      "updatedAt": "2026-08-17T10:27:16.274Z",
      "teacherId": "56006fa6-0dd0-45be-b353-76b55c0e79a0",
      "academicPeriodId": "f878f872-2b64-4c7f-b650-5ed50c0f2b38",
      "dayOfWeek": "MONDAY",
      "startTime": "07:00:00",
      "endTime": "19:00:00"
    }
  ],
  "message": "Success"
}
```

An unknown/not-owned `academicPeriodId` in the filter is **not** an error — it just yields an empty array (only `GET`/`POST`/`PATCH` validate the id's existence/ownership; the list filter is a plain `WHERE` clause).

---

## `GET /api/schedules/:id`

**Auth:** Bearer JWT required. Same 400 (bad uuid) / 404 (missing/not owned) rules as every other `:id` route in this API.

---

## `POST /api/schedules`

Create a schedule entry.

**Auth:** Bearer JWT required.

**Body:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `academicPeriodId` | string (uuid) | yes | Must be an academic period **you own** |
| `dayOfWeek` | string | yes | One of `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY` |
| `startTime` | string | yes | 24-hour `"HH:mm"`, e.g. `"07:00"` |
| `endTime` | string | yes | 24-hour `"HH:mm"`; must be **after** `startTime` |

```json
{
  "academicPeriodId": "f878f872-2b64-4c7f-b650-5ed50c0f2b38",
  "dayOfWeek": "MONDAY",
  "startTime": "07:00",
  "endTime": "19:00"
}
```

**Success — `201 Created`:** the created schedule. Note the response's `startTime`/`endTime` come back as `"HH:mm:ss"` (e.g. `"07:00:00"`) — the API normalizes the submitted `"HH:mm"` before writing, so a `GET` later returns the exact same format you'll see here (no `:00` seconds mismatch to worry about client-side).

**Errors:**

| Status | Condition |
|---|---|
| `400` | Missing/malformed field, invalid `dayOfWeek` value, or `startTime >= endTime` |
| `404` | `academicPeriodId` doesn't exist or isn't yours — same message either way (`"Academic period not found"`) |
| `409` | You already have a schedule for this `(academicPeriodId, dayOfWeek)` pair |

---

## `PATCH /api/schedules/:id`

Partial update.

**Auth:** Bearer JWT required.

**Body:** any subset of the `POST` fields.

**Success — `200 OK`:** the updated schedule.

**Errors:** same 400/404/409 rules. `academicPeriodId` ownership is only re-checked if you're actually changing it to a different value; the time-range check always re-runs against the merged result (e.g. patching only `startTime` still validates against the existing `endTime`), and a rejection leaves the row unchanged.

---

## `DELETE /api/schedules/:id`

**Auth:** Bearer JWT required.

**Success — `200 OK`:** `{ "data": { "id": "..." } }`

**Errors:** `404` if missing/not yours.
