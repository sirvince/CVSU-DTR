# Teacher DTR Automation System — API Documentation

Reference documentation for the backend REST API (`apps/api`), organized one file per feature. This describes the API **as implemented and verified**, not as originally planned — where the implementation diverges from `docs/stack(1).md`'s API sketch, that's called out explicitly in each file.

For the architectural "why" behind these endpoints (design decisions, business-rule rationale, verification notes), see `CLAUDE.md` at the repo root — this documentation is the "what," that file is the "why."

## Base URL and prefix

All routes are served under the global prefix `/api`. Locally (see `apps/api/CLAUDE.md`'s Commands section): `http://localhost:3000/api/...` (or whatever `APP_PORT` is set to).

## Authentication

Every endpoint except `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/health` requires a JSON Web Token:

```
Authorization: Bearer <accessToken>
```

Obtain a token from `POST /api/auth/login` (or `POST /api/auth/register`, which also logs you in) — see [`auth.md`](./auth.md). Tokens expire after `JWT_ACCESS_EXPIRES_IN` (15 minutes by default); there is no refresh-token flow yet.

## Response envelope

Every JSON response (success or failure) is wrapped the same way:

**Success:**
```json
{
  "success": true,
  "data": { /* endpoint-specific payload */ },
  "message": "Success"
}
```

**Failure:**
```json
{
  "success": false,
  "message": "A human-readable error message",
  "errors": []
}
```

`errors` is populated with individual field-validation messages when the failure is a `400` from request-body validation (e.g. `["startTime must be in 24-hour HH:mm format"]`); it's empty for business-rule rejections (404/409/400 thrown deliberately by a service) and for `401`/`403`.

The one exception to the envelope is **file downloads** (`GET /api/dtr/generate/:id/download`), which return raw binary bytes with `Content-Disposition`/`Content-Type` headers on success — errors from that endpoint (bad id, not found) still use the standard JSON envelope, since they're thrown before the file stream starts.

## Ownership model

Every resource below is scoped to the authenticated teacher (the JWT's `sub` claim, i.e. the `User.id`) — there is no cross-teacher visibility anywhere in this API, and no admin override yet. Requesting or modifying **another** teacher's resource by id returns `404 Not Found`, not `403 Forbidden` — this is deliberate, so a teacher can't distinguish "that id doesn't exist" from "that id belongs to someone else."

## Common error statuses

| Status | Meaning | Typical cause |
|---|---|---|
| `400` | Bad Request | Request body/query failed validation (bad shape, format, enum value), or a business rule rejected the input (e.g. `startDate >= endDate`) |
| `401` | Unauthorized | Missing/invalid/expired JWT |
| `404` | Not Found | The resource doesn't exist, **or** exists but belongs to a different teacher |
| `409` | Conflict | A uniqueness rule was violated (duplicate schedule day, duplicate academic period, etc.) |

## Feature index

| Feature | File | Endpoints |
|---|---|---|
| Auth | [`auth.md`](./auth.md) | register, login, current user |
| Teacher Profile | [`teacher-profile.md`](./teacher-profile.md) | get/create/update own profile |
| Academic Periods | [`academic-periods.md`](./academic-periods.md) | full CRUD |
| Weekly Schedules | [`schedules.md`](./schedules.md) | full CRUD |
| DTR Periods | [`dtr-periods.md`](./dtr-periods.md) | full CRUD |
| DTR Calendar | [`dtr-calendar.md`](./dtr-calendar.md) | list days, generate calendar |
| Daily Attendance & Status | [`dtr-days.md`](./dtr-days.md) | get/update a single day |
| DTR Validation | [`dtr-validation.md`](./dtr-validation.md) | non-blocking warnings |
| DTR Generation & Download | [`dtr-generation.md`](./dtr-generation.md) | generate Excel, download it |

## Typical end-to-end flow

The features build on each other in this order — later ones depend on data created by earlier ones:

```
1. Register / Login                     → auth.md
2. Create teacher profile                → teacher-profile.md
3. Create an academic period              → academic-periods.md
4. Configure weekly schedule (Mon/Wed/…)   → schedules.md
5. Create a DTR period (e.g. Aug 16-31)     → dtr-periods.md
6. Generate the DTR calendar                 → dtr-calendar.md   (materializes one row per scheduled date)
7. Enter arrival/departure per day, or          → dtr-days.md    (PATCH the materialized rows)
   mark a day ONLINE/SUSPENDED/HOLIDAY/etc.
8. Validate (optional, informational)             → dtr-validation.md
9. Generate the Excel file                          → dtr-generation.md (POST /dtr/generate)
10. Download it                                       → dtr-generation.md (GET .../download)
```
