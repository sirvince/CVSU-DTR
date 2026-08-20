# DTR Generation & Download API

Turns a DTR period's verified data into the official DTR Excel workbook and lets you download it. This is the final step in the workflow (`docs/business-analysis-project-baseline.md`'s Key Principle: "automate the preparation, not the authority" — this endpoint prepares the document; the teacher remains responsible for reviewing it before submitting).

**The official master template is never modified** — every generation loads a fresh copy, populates it, and saves a brand-new file. See `CLAUDE.md`'s "Excel generation" section for the full cell-by-cell mapping and the reasoning behind it; this document covers the API surface.

---

## `POST /api/dtr/generate`

Generate a new Excel file for a DTR period.

**Auth:** Bearer JWT required.

**Prerequisites:** you must have a [teacher profile](./teacher-profile.md) (there's no name to put on the form otherwise), and the DTR period must fall within a **single calendar month** — the official form is a fixed 31-row single-month grid, so a period spanning two months has nowhere to put the second month's days.

**Body:**

```json
{ "dtrPeriodId": "c7bd758f-c626-43f5-bd25-b5804eb02529" }
```

**Success — `201 Created`:** metadata about the generation — **not the file bytes**. Use `id` to download it (see below).

```json
{
  "success": true,
  "data": {
    "id": "dbb91a21-bfe5-40c6-81d3-97df00789b2a",
    "createdAt": "2026-08-17T13:00:08.922Z",
    "updatedAt": "2026-08-17T13:00:08.922Z",
    "teacherId": "751ba4a1-32ff-457c-b6a6-cd1a2f5ce6cc",
    "dtrPeriodId": "18bd6da3-5412-431c-b421-16b51786ca94",
    "version": 1,
    "fileName": "DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx",
    "filePath": "storage\\generated\\ab816428-4294-4851-b37e-319513010d07.xlsx",
    "generatedAt": "2026-08-17T13:00:08.912Z"
  },
  "message": "Success"
}
```

- `fileName` — the human-readable name (`DTR_<LASTNAME>_<FIRSTNAME-MIDDLE>_<MON>-<startDay>-<endDay>-<year>.xlsx`), used as the download's filename. This is what you'd show a user, not `filePath`.
- `filePath` — an internal server-side storage path (a random uuid, not the readable name) — not meaningful to a client, and not guaranteed stable; use the `download` endpoint below rather than trying to construct a path yourself.
- `version` — increments each time you regenerate the **same** DTR period (`1 + <number of prior generations for this period>`). **Regenerating never overwrites a previous version's file** — each generation gets its own file on disk, all independently downloadable by their own `id`.

**What gets populated on the form** (see `CLAUDE.md` for the full cell map): teacher name, the period label (your `DtrPeriod.label` if you set one, otherwise auto-formatted from the dates), and for each day — Arrival, Departure, and, for any non-`REGULAR` day, its status (+ reason, if set) written as a note. Days you haven't entered attendance for are left blank on the form, exactly as stored.

**Errors:**

| Status | Condition |
|---|---|
| `400` | `dtrPeriodId` missing/not a uuid, **or** the period spans more than one calendar month |
| `404` | `dtrPeriodId` doesn't exist/isn't yours, **or** you don't have a teacher profile yet |

---

## `GET /api/dtr/generate/:id/download`

Download a previously generated file.

**Auth:** Bearer JWT required.

**Path param:** `:id` — a `DtrGeneration` id (the `id` field from a `POST /api/dtr/generate` response).

**Success — `200 OK`:** the raw `.xlsx` file bytes.

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx"
Content-Length: <bytes>
```

This is the **one endpoint in the whole API that isn't wrapped in the standard `{ success, data, message }` envelope** on success — it's a raw file stream, since that's what a "download" needs to be. Errors from this endpoint (bad id, file missing) *do* still use the standard JSON envelope, since those are detected and thrown before any file streaming starts.

**Errors:**

| Status | Body | Condition |
|---|---|---|
| `400` | `{ "success": false, "message": "Validation failed (uuid is expected)", ... }` | `:id` isn't a valid uuid |
| `404` | `{ "success": false, "message": "DTR generation not found", ... }` | No generation with that id belongs to you |
| `404` | `{ "success": false, "message": "The generated DTR file is no longer available — generate it again", ... }` | The `DtrGeneration` row exists, but its file is missing from disk |

There is currently no endpoint to **list** all past generations for a period (a "history" view) — only `POST /generate`'s own response gives you an id to download. Listing history is a deliberately deferred, lower-priority feature (see `CLAUDE.md`'s note on `GET /dtr/generations`), not something forgotten.
