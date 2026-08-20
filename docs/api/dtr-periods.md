# DTR Periods API

A DTR period is a specific date range you're preparing a DTR for (e.g. "August 16–31, 2026" — the typical Philippine semi-monthly pay period), scoped to one academic period. Once created, a DTR period is what you [generate a calendar](./dtr-calendar.md) against, [enter attendance](./dtr-days.md) into, [validate](./dtr-validation.md), and ultimately [generate an Excel file](./dtr-generation.md) from.

**Important constraint not enforced at this layer, but downstream**: the DTR Excel template is a single-calendar-month grid, so a period spanning two calendar months can be *created* here but will be **rejected at generation time** (`400` from `POST /dtr/generate`) — see [`dtr-generation.md`](./dtr-generation.md).

---

## `GET /api/dtr/periods`

List your own DTR periods, newest `startDate` first.

**Auth:** Bearer JWT required.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `academicPeriodId` | no | Filter to periods within one academic period |

**Success — `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "c7bd758f-c626-43f5-bd25-b5804eb02529",
      "createdAt": "2026-08-17T10:34:52.701Z",
      "updatedAt": "2026-08-17T10:34:52.701Z",
      "teacherId": "2e30c553-f80b-42d1-bd9b-dfd6a5f13676",
      "academicPeriodId": "89ff7379-9ac2-4326-a6d2-973d18f83946",
      "startDate": "2026-08-16",
      "endDate": "2026-08-31",
      "label": "August 16-31"
    }
  ],
  "message": "Success"
}
```

`label` is optional free text (e.g. `"August 16-31"`) — if you don't set one, [DTR generation](./dtr-generation.md) auto-formats one from the dates instead (`"August 16-31, 2026"`).

---

## `GET /api/dtr/periods/:id`

Standard 400 (bad uuid) / 404 (missing/not owned) rules.

---

## `POST /api/dtr/periods`

Create a DTR period.

**Auth:** Bearer JWT required.

**Body:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `academicPeriodId` | string (uuid) | yes | Must be an academic period **you own** |
| `startDate` | string | yes | ISO date (`YYYY-MM-DD`) |
| `endDate` | string | yes | ISO date; must be **after** `startDate`, and the whole range must fall **within** the parent academic period's `[startDate, endDate]` |
| `label` | string | no | ≤100 chars |

```json
{
  "academicPeriodId": "89ff7379-9ac2-4326-a6d2-973d18f83946",
  "startDate": "2026-08-16",
  "endDate": "2026-08-31",
  "label": "August 16-31"
}
```

**Success — `201 Created`:** the created period.

**Errors:**

| Status | Condition |
|---|---|
| `400` | `startDate >= endDate`, **or** the range falls outside the parent academic period's dates (message: `"DTR period must fall within the selected academic period"`) |
| `404` | `academicPeriodId` doesn't exist or isn't yours |
| `409` | You already have a DTR period with this exact `(academicPeriodId, startDate, endDate)` |

---

## `PATCH /api/dtr/periods/:id`

Partial update.

**Auth:** Bearer JWT required.

**Body:** any subset of the `POST` fields.

**Success — `200 OK`:** the updated period.

**Errors:** same 400/404/409 rules. `academicPeriodId` ownership is only re-checked if you're changing it; the academic-period-range check **always** re-runs (since dates may have changed) — a rejection leaves the row unchanged.

---

## `DELETE /api/dtr/periods/:id`

**Auth:** Bearer JWT required.

**Success — `200 OK`:** `{ "data": { "id": "..." } }`

**Errors:** `404` if missing/not yours. No cascade protection for [DTR days](./dtr-days.md) already generated under this period — see the cross-entity-relations note in `CLAUDE.md`.
