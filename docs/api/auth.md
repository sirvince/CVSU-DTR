# Auth API

JWT-based authentication. There's no institutional SSO or password-reset flow yet (see `docs/feature(1).md` §1 for planned future work) — this is username/password only.

`POST /auth/register` is **not** part of the original docs' API sketch (`docs/stack(1).md` §10 only lists `POST /auth/login`) — it was added because the MVP has no admin module or seeding mechanism to create the first accounts. Every teacher self-registers.

---

## `POST /api/auth/register`

Create a new account and immediately log in.

**Auth:** None required.

**Body:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | Must be a valid email address |
| `password` | string | yes | Minimum 8 characters |

```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

**Success — `201 Created`** (returns the same shape as login):

```json
{
  "success": true,
  "data": { "accessToken": "eyJhbGciOi..." },
  "message": "Success"
}
```

**Errors:**

| Status | Condition |
|---|---|
| `400` | `email` not a valid address, or `password` shorter than 8 characters |
| `409` | An account with this email already exists |

New accounts always get `role: TEACHER` (see `common/enums/user-role.enum.ts` — `ADMIN` exists as a value but nothing in this API currently creates or checks it).

---

## `POST /api/auth/login`

Exchange email + password for a JWT.

**Auth:** None required.

**Body:** same shape as register — `{ email, password }`.

**Success — `200 OK`:**

```json
{
  "success": true,
  "data": { "accessToken": "eyJhbGciOi..." },
  "message": "Success"
}
```

**Errors:**

| Status | Condition |
|---|---|
| `400` | `email`/`password` fail basic shape validation |
| `401` | Email not found, account inactive, or password doesn't match — deliberately the *same* message for all three (`"Invalid credentials"`) so a failed login can't be used to enumerate which emails have accounts |

The token payload (decoded, for reference — you don't need to decode it client-side, just send it back as-is): `{ sub: <userId>, email, role, iat, exp }`. Default expiry is 15 minutes (`JWT_ACCESS_EXPIRES_IN`). There is no refresh-token endpoint — when the token expires, log in again.

---

## `GET /api/auth/me`

Returns the decoded JWT payload for the currently authenticated user. Mainly useful for a frontend to confirm a stored token is still valid and see who it belongs to, without a full profile fetch.

**Auth:** Bearer JWT required.

**Success — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "sub": "751ba4a1-32ff-457c-b6a6-cd1a2f5ce6cc",
    "email": "teacher@example.com",
    "role": "TEACHER",
    "iat": 1786961382,
    "exp": 1786962282
  },
  "message": "Success"
}
```

Note this is the **auth identity**, not the teacher's name/employee info — for that, see [`teacher-profile.md`](./teacher-profile.md).

**Errors:**

| Status | Condition |
|---|---|
| `401` | Missing, malformed, or expired token |
