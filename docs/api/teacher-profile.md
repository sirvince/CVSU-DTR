# Teacher Profile API

Stores the personal/employment info needed to populate the official DTR Excel template (`docs/feature(1).md` §2: employee ID, name, position, department, campus). Every teacher has **at most one** profile — it's created once and reused across every academic period and DTR generation, not re-entered each time.

All three endpoints operate on **your own** profile only — there's no `:id` in any of these routes; the profile is resolved from the JWT. `DELETE` doesn't exist: a profile isn't something the docs describe deleting (it's meant to be reused indefinitely — `docs/business-analysis-project-baseline.md` FR-002).

**A profile must exist before you can generate a DTR** — see [`dtr-generation.md`](./dtr-generation.md), which 404s if you try to generate without one.

---

## `GET /api/me/profile`

Fetch your own profile.

**Auth:** Bearer JWT required.

**Success — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "f35e2d49-ddc1-4051-9562-fc7f2299f55c",
    "createdAt": "2026-08-17T10:15:17.918Z",
    "updatedAt": "2026-08-17T10:15:17.918Z",
    "userId": "46d34015-9947-4045-afcf-601054a21f44",
    "employeeId": "EMP-001",
    "firstName": "John",
    "middleName": "Vincent",
    "lastName": "Dallego",
    "position": "Instructor",
    "department": "CS",
    "campus": "Main"
  },
  "message": "Success"
}
```

**Errors:**

| Status | Condition |
|---|---|
| `401` | Missing/invalid token |
| `404` | You haven't created a profile yet — message: `"Teacher profile has not been created yet"` |

---

## `POST /api/me/profile`

Create your profile. One-time — a second call fails with `409`.

**Auth:** Bearer JWT required.

**Body:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `employeeId` | string | yes | 1–50 chars, **globally unique** across all teachers |
| `firstName` | string | yes | 1–100 chars |
| `middleName` | string | no | ≤100 chars |
| `lastName` | string | yes | 1–100 chars |
| `position` | string | no | ≤100 chars |
| `department` | string | no | ≤100 chars |
| `campus` | string | no | ≤100 chars |

```json
{
  "employeeId": "EMP-001",
  "firstName": "John",
  "middleName": "Vincent",
  "lastName": "Dallego",
  "position": "Instructor",
  "department": "CS",
  "campus": "Main"
}
```

**Success — `201 Created`:** the created profile (same shape as `GET`).

**Errors:**

| Status | Condition |
|---|---|
| `400` | Missing required field, or a field over its length limit |
| `409` | You already have a profile (`"Teacher profile already exists"`), **or** `employeeId` is already used by another teacher (`"Employee ID is already in use"` — enforced by both a pre-check and a DB unique-constraint fallback, so it's race-safe) |

---

## `PATCH /api/me/profile`

Partially update your profile. Any subset of the `POST` fields; omitted fields are left unchanged.

**Auth:** Bearer JWT required.

**Body:** any subset of the `POST` fields, e.g.:

```json
{ "position": "Senior Instructor" }
```

**Success — `200 OK`:** the updated profile.

**Errors:**

| Status | Condition |
|---|---|
| `400` | A submitted field fails validation |
| `404` | No profile exists yet — create one first with `POST` |
| `409` | Changing `employeeId` to one already used by another teacher |
