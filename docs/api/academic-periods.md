# Academic Periods API

An academic period is a broad time range (e.g. "2026–2027, 1st Semester") that a teacher's weekly [schedules](./schedules.md) and [DTR periods](./dtr-periods.md) both belong to.

**Judgment call worth knowing about:** each academic period is owned by the teacher who created it (self-service, one row per teacher per period) rather than being a shared/admin-managed lookup table other teachers select from — the MVP has no admin module, so there's nowhere else for these to live. If an admin module gets built later, this model may need revisiting.

`docs/stack(1).md` §10 only lists `GET`/`POST` for this resource; `PATCH`/`DELETE` were added anyway since teachers will inevitably need to fix a typo'd year or remove a period created by mistake.

---

## `GET /api/academic-periods`

List your own academic periods, newest `startDate` first.

**Auth:** Bearer JWT required.

**Success — `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "89ff7379-9ac2-4326-a6d2-973d18f83946",
      "createdAt": "2026-08-17T10:34:29.000Z",
      "updatedAt": "2026-08-17T10:34:29.000Z",
      "teacherId": "2e30c553-f80b-42d1-bd9b-dfd6a5f13676",
      "academicYear": "2026-2027",
      "semester": "1st Semester",
      "startDate": "2026-08-01",
      "endDate": "2027-01-31"
    }
  ],
  "message": "Success"
}
```

Empty array (not a 404) if you have none yet.

---

## `GET /api/academic-periods/:id`

Fetch one of your own academic periods.

**Auth:** Bearer JWT required.

**Errors:**

| Status | Condition |
|---|---|
| `400` | `:id` isn't a valid UUID |
| `404` | Doesn't exist, or belongs to a different teacher |

---

## `POST /api/academic-periods`

Create an academic period.

**Auth:** Bearer JWT required.

**Body:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `academicYear` | string | yes | 1–20 chars, e.g. `"2026-2027"` |
| `semester` | string | yes | 1–50 chars, e.g. `"1st Semester"` |
| `startDate` | string | yes | ISO date string (`YYYY-MM-DD`) |
| `endDate` | string | yes | ISO date string; must be **after** `startDate` |

```json
{
  "academicYear": "2026-2027",
  "semester": "1st Semester",
  "startDate": "2026-08-01",
  "endDate": "2027-01-31"
}
```

**Success — `201 Created`:** the created period.

**Errors:**

| Status | Condition |
|---|---|
| `400` | Missing/malformed field, or `startDate >= endDate` |
| `409` | You already have a period with this exact `(academicYear, semester)` combination |

---

## `PATCH /api/academic-periods/:id`

Partial update. Any subset of the `POST` fields.

**Auth:** Bearer JWT required.

**Success — `200 OK`:** the updated period.

**Errors:** same 400/404/409 rules as create/get. Validation always re-runs against the **merged** result — e.g. changing only `endDate` still gets checked against the existing `startDate`, and a rejection leaves the row completely unchanged (nothing is partially applied).

---

## `DELETE /api/academic-periods/:id`

**Auth:** Bearer JWT required.

**Success — `200 OK`:**

```json
{ "success": true, "data": { "id": "89ff7379-9ac2-4326-a6d2-973d18f83946" }, "message": "Success" }
```

**Errors:**

| Status | Condition |
|---|---|
| `404` | Doesn't exist, or belongs to a different teacher |

There's no protection yet against deleting a period that schedules/DTR periods still reference (no DB foreign-key relations exist between these tables — see `CLAUDE.md`'s "No cross-entity TypeORM relations exist yet" note) — deleting one won't cascade-delete or block on dependents.
