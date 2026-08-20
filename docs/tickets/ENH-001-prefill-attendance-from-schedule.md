# ENH-001 — Pre-fill Daily Attendance from Weekly Schedule

> Filled out using `docs/ticket-base-detailed.md`'s template. **Status: DONE — implemented and verified live.** Built per the "Final Choice" in §25 (per-day, client-side-only, per-field pre-fill, confirmed only by the teacher's existing explicit Save action); see `CLAUDE.md`'s "Daily Attendance & Status editor" note for the implementation and live-verification summary.
>
> **Follow-up addendum 1:** the same pre-fill treatment was also applied to `DtrPeriodDetailPage.tsx`'s calendar table (Arrival/Departure columns), beyond the `DtrDayEditorPage.tsx` scope §1's Module field originally named — a read-only display variant (`renderAttendanceCell()`), not a form field, so it sits even further from the BR-004 line than the editor does (no submit path exists on that table at all). Verified live the same way; see `CLAUDE.md` for details.
>
> **Follow-up addendum 2 — superseding change, confirmed with the user:** the client-side-only "pre-fill" design in §7–§9 and §25 (unsaved suggestion, requires explicit Save) was explicitly replaced with a stronger behavior at the user's request: `dtr/calendar/dtr-calendar.service.ts`'s `generate()` now auto-fills **and immediately persists** `arrivalTime`/`departureTime` from the schedule at row-creation time — a confirmed, deliberate exception to BR-004, not the client-only workaround this ticket originally proposed to stay inside it. Additionally, editing Arrival in the Day Editor now auto-shifts Departure by the same amount (preserving the scheduled shift duration), implemented via `shiftTimeByScheduleDuration()` in `lib/date.ts` and a `register('arrivalTime', { onChange: ... })` handler in `DtrDayEditorPage.tsx`. The original client-side pre-fill/hint logic (§7 FR-001–004, §25) remains in the code only as a fallback for `DtrDay` rows generated before this backend change existed. A known side effect was surfaced and explicitly left unaddressed on the user's instruction: a day auto-filled then marked non-`REGULAR` without the teacher clearing the times can produce a generated Excel row showing both the status label and a clock-in/out time — see `CLAUDE.md`'s "DTR calendar generation" section for the full writeup. Everything below this point (§7 onward) describes the **original, now-superseded** design; see `CLAUDE.md` for the as-built behavior.
>
> Numbered `ENH-001` (Enhancement), not `DTR-0XX` — same reasoning as `BUG-001`: `docs/business-analysis-project-baseline.md` §19 already reserves DTR-014 through DTR-020 for specific other features, and this isn't one of them.

---

## 1. Ticket Information

| Field | Value |
|---|---|
| Ticket ID | `ENH-001` |
| Title | Pre-fill Daily Attendance from Weekly Schedule |
| Type | Enhancement |
| Priority | P1 |
| Status | DONE |
| Epic | Teacher DTR Automation System |
| Module | Frontend — `apps/web/src/pages/DtrDayEditorPage.tsx` |
| Assignee | — |
| Reviewer | — |
| Estimate | Small (frontend-only; see §14) |
| Dependencies | DTR-007 (DTR Calendar Generation), DTR-008 (Daily Attendance Entry) — both done, both unaffected |
| Related Tickets | None |

---

## 2. Description

### Background

Reported by the user after testing the real generate-and-review flow: for a normal day where the teacher actually worked their usual schedule, they still have to manually type the full Arrival and Departure time into the Day Editor (`docs/api/dtr-days.md`) even though that time is already known — it's sitting right there as the day's `scheduleStartTime`/`scheduleEndTime`, already returned on every `DtrDay` object from `GET /dtr/calendar` and `GET /dtr/days/:date`.

### Problem

Every scheduled day currently starts with **blank** Arrival/Departure fields in the Day Editor, regardless of whether that day's schedule is already known. For a teacher whose actual arrival/departure usually matches their schedule almost exactly, this means re-typing the same `07:00`/`19:00` (or whatever their schedule is) by hand, one field at a time, for every single day in the DTR period — exactly the "repetitive manual encoding" the whole system exists to eliminate (`docs/business-analysis-project-baseline.md` §2.2, §4).

### Proposed Solution

When the Day Editor opens for a day that has no `arrivalTime`/`departureTime` saved yet, pre-fill the form's Arrival/Departure inputs with that day's `scheduleStartTime`/`scheduleEndTime` as a **starting value the teacher can edit or clear** — not a value that's silently saved. The teacher still has to look at HR's actual attendance details and either confirm (leave as-is) or correct (edit) the time before clicking Save; nothing changes about what gets persisted or when.

### User Impact

For a day the teacher actually worked on schedule: open the editor, the correct times are already sitting in the fields, click Save. For a day where arrival/departure differed: open the editor, the fields show the *expected* time as a reference point, edit to the actual time, click Save. Either way, less retyping than starting from a blank field every time.

### Technical Impact

Frontend only, and narrowly scoped: `DtrDayEditorPage.tsx`'s `useForm`'s `values`/`defaultValues` computation. No backend change — `scheduleStartTime`/`scheduleEndTime` are already present on the `DtrDay` payload (`docs/api/dtr-calendar.md`, `docs/api/dtr-days.md`); this is purely about what the frontend does with data it already has.

---

## 3. Objective

Reduce redundant manual time entry for days where the teacher's actual attendance matches (or nearly matches) their configured weekly schedule, without changing what's actually saved to a `DtrDay` record or when.

---

## 4. Goal

Cut the "type the same time you already told the system to expect" step out of the common case, while leaving the "schedule is not attendance until a human confirms it" guarantee completely intact.

---

## 5. Business Context

### Current Process (this system, today)

```text
DTR Calendar generated (schedule snapshotted onto each day)
        ↓
Teacher opens a day → sees BLANK Arrival/Departure
        ↓
Teacher manually types Arrival + Departure from HR's attendance details
        ↓
Teacher clicks Save
```

### Target Process

```text
DTR Calendar generated (schedule snapshotted onto each day)
        ↓
Teacher opens a day → sees Arrival/Departure PRE-FILLED with the day's schedule
        ↓
Teacher either leaves it (matches HR's attendance details) or edits it (differs)
        ↓
Teacher clicks Save — same as today, still the moment data is verified/committed
```

### Problem

- Repetitive manual encoding of a value the system already has (docs/business-analysis-project-baseline.md §2.2's "Repetitive manual encoding," "Higher possibility of encoding errors")

### Target

- Teacher effort shifts from *typing* to *verifying* — matches the docs' core principle: **"the teacher should verify the DTR, not repeatedly rebuild and format the DTR"** (baseline doc §Executive Summary / Final Business Statement)

---

## 6. Scope

### In Scope

- [x] Pre-fill `arrivalTime`/`departureTime` form defaults from `scheduleStartTime`/`scheduleEndTime` when opening the Day Editor for a day with no saved arrival/departure yet
- [x] Only applies when the day's `status` is `REGULAR` and it actually has a `scheduleStartTime`/`scheduleEndTime` (i.e., a day generated from a real weekly-schedule match — see `docs/api/dtr-calendar.md`)
- [x] The pre-filled value is purely a client-side form default — no `PATCH` request fires until the teacher explicitly clicks Save

### Out of Scope

- [ ] Any backend change — no new endpoint, no new field, no change to what `dtr-days.md`'s `PATCH` accepts or persists
- [ ] Bulk "apply schedule to every unfilled day in this period" action (a plausible follow-up, but a materially different feature — batch-writing many `DtrDay` rows at once — not needed to solve the reported problem, which is about the single-day editor)
- [ ] Any change to `dtr/calendar`'s generation logic — days are still created with `arrivalTime: null`/`departureTime: null` server-side; this ticket only changes what the *form* shows before the teacher has typed or saved anything

### MVP Constraint

Must not weaken BR-004 ("schedule must never automatically become attendance") — see §8 and §25 for exactly how this ticket's design keeps that true.

---

## 7. Functional Requirements

### FR-001 — Pre-fill on empty REGULAR days

When the Day Editor loads a day where `status === 'REGULAR'` and both `arrivalTime` and `departureTime` are currently `null`, the Arrival and Departure form fields shall default to that day's `scheduleStartTime`/`scheduleEndTime` (truncated to `"HH:mm"` for the `<input type="time">`, same as the existing `formatTime`/slice(0,5) pattern already used elsewhere on this page).

### FR-002 — No pre-fill once real data exists

When a day already has a saved `arrivalTime`/`departureTime` (from a previous Save), the form shall show that saved value, never the schedule — matches current behavior, unchanged.

### FR-003 — No pre-fill for non-REGULAR days

When a day's `status` is not `REGULAR` (`ONLINE`, `SUSPENDED`, `HOLIDAY`, `NO_CLASS`, `OTHER`), the Arrival/Departure fields shall not be pre-filled — these statuses expect blank attendance by default (BR-006), and pre-filling them would contradict that.

### FR-004 — Pre-filled value is not saved until Save is clicked

The pre-fill shall exist only in the form's local state. `PATCH /api/dtr/days/:date` shall fire only on explicit submit, exactly as today — no `useEffect`-driven auto-save, no debounced background write.

---

## 8. Business Rules

### BR-004 (existing, from the baseline doc — reproduced here because this ticket sits directly on top of it)

```text
The schedule must never automatically become attendance.
```

### How this ticket stays inside that rule

```text
A pre-filled form field is not a saved attendance record.
Nothing is written to dtr_days.arrival_time / departure_time
until the teacher explicitly submits the form.
```

The distinction this ticket relies on: BR-004 is about the system silently treating *unverified* schedule data as if it were *verified* attendance — i.e., persisting it without a human confirming it. A pre-filled-but-still-editable, still-requiring-an-explicit-Save form field never persists anything on its own; the teacher's Save click is exactly the same verification/confirmation act it is today, just starting from a more useful default instead of a blank field. See §25 for the alternatives that were considered and rejected specifically because they'd cross this line.

---

## 9. User Flow

## Main Flow

```text
Teacher clicks "Edit" on a scheduled, not-yet-attended REGULAR day
  ↓
Day Editor loads via GET /dtr/days/:date — day has scheduleStartTime/
scheduleEndTime set, arrivalTime/departureTime both null
  ↓
Form's Arrival/Departure fields render pre-filled with the schedule times
  ↓
Teacher reviews against HR's actual attendance details:
  - Matches → leaves fields as-is
  - Differs → edits the field(s) that differ
  ↓
Teacher clicks Save → PATCH /api/dtr/days/:date with whatever is currently
in the fields (pre-filled-and-untouched, or edited — API can't tell the
difference, which is correct: both are the teacher's confirmed input)
  ↓
Expected Result: DtrDay updated exactly as it would be today, just reached
with less typing
```

## Alternative Flow

```text
Normal Flow (day already has saved arrival/departure from a previous visit)
    ↓
Day Editor loads → fields show the SAVED values, not the schedule
    ↓
Teacher edits if needed, Saves
    ↓
Expected Result: unchanged from current behavior (FR-002)
```

## Error Flow

```text
Teacher clears a pre-filled field entirely, leaving it blank, and Saves
    ↓
Same validation as today applies — blank arrival/departure is allowed
(docs/api/dtr-days.md: both fields are optional), no new error case
introduced by this ticket
```

---

## 10. UI / UX Requirements

### Page

`/dtr/:periodId/:date` (`DtrDayEditorPage.tsx`)

### Components

- [ ] No new components — reuses the existing `TextField` (`type="time"`) inputs already on this page

### Required Fields

No change to which fields exist or their validation rules (`docs/api/dtr-days.md`'s `arrivalTime`/`departureTime` rules, already mirrored in `api/dtr-day-schema.ts`).

### UI States

#### Loading

Unchanged.

#### Empty

This *is* the state this ticket changes: "empty" (no saved arrival/departure on a REGULAR scheduled day) now shows the schedule as a starting point instead of a blank field.

#### Error

Unchanged.

#### Success

Unchanged.

#### Disabled

Unchanged.

---

## 11. Database Requirements

Not applicable — no schema change.

---

## 12. API Requirements

Not applicable — no API change. Confirmed the data this ticket needs is already returned:

```text
GET /api/dtr/days/:date  →  DtrDay { ..., scheduleStartTime, scheduleEndTime, arrivalTime, departureTime, ... }
```

(`docs/api/dtr-days.md`)

---

## 13. Backend Implementation

Not applicable — no backend files touched.

---

## 14. Frontend Implementation

- [x] In `DtrDayEditorPage.tsx`, change the `useForm`'s `values` computation: when `dayQuery.data.status === 'REGULAR'` and `arrivalTime`/`departureTime` are both null/undefined, default them to `dayQuery.data.scheduleStartTime`/`scheduleEndTime` (sliced to `"HH:mm"`) instead of `undefined` — implemented per-field (§15's recommendation), not per-day
- [x] No change needed to `dtrDaySchema` (`api/dtr-day-schema.ts`) — validation rules are the same regardless of where the initial value came from
- [x] Small visual hint added: `TextField` gained an optional `hint` prop rendering muted text below the input; the Day Editor passes `"From schedule — confirm or edit"` when that field is pre-filled
- [x] `tsc -b` / `oxlint` clean

---

## 15. Validation and Edge Cases

### Input

- [x] Day has a schedule but teacher clears both fields and saves blank — allowed today, stays allowed (matches "Missing Arrival"/"Missing Departure" being a *warning*, not a hard error — `docs/api/dtr-validation.md`)
- [x] Day has `scheduleStartTime` but no `scheduleEndTime` (shouldn't happen given how `dtr/calendar` snapshots both together, but the pre-fill logic should handle either being null independently rather than assuming both-or-neither) — each field's pre-fill condition checks its own schedule value independently

### Business

- [x] Day already has one of arrival/departure saved but not the other (a partially-completed day) — resolved as recommended: per-field, not per-day. Only the still-null field pre-fills from the schedule; a field with a saved value always shows that value.

### Boundary

- [x] First/last day of the DTR period — no special handling needed, behaves the same as any other day

---

## 16. DTR-Specific Validation

- [ ] Arrival missing / Departure missing warnings (`docs/api/dtr-validation.md`) — unaffected; a pre-filled-but-unsaved value doesn't exist server-side, so validation continues to run against whatever was actually saved, exactly as today
- [ ] Official policy treatment — unaffected; this ticket changes a form default, not any business/payroll logic (BR-008 untouched)

---

## 17. Excel Template Requirements

Not applicable — no change to generation/mapping. This ticket only affects what a teacher sees *before* saving; the Excel generator (`dtr/generator/`) only ever reads already-saved `DtrDay` rows, exactly as today.

---

## 18. Security Requirements

- [ ] No change — no new data exposed, no new write path, same ownership checks apply to the existing `GET`/`PATCH /dtr/days/:date` calls

---

## 19. Performance Requirements

Negligible — this is a client-side default-value computation on data already fetched for the page; no additional network requests.

---

## 20. Error Handling

No new error cases introduced (see §15's Input/Business notes for the two existing behaviors this ticket needs to be consistent with, not new failure modes).

---

## 21. Testing

### Unit Tests

No dedicated frontend unit-test suite exists yet for this page (no prior `.spec`/`.test` file to extend); the four scenarios below were instead confirmed directly via live browser + real API/DB verification (see E2E/Manual), which exercises the same `values` computation end-to-end. Revisit if/when a component-test harness is added to `apps/web`.

### E2E / Manual — done, live

- [x] Opened a freshly-generated `REGULAR` day (`scheduleStartTime: "07:00:00"`, `scheduleEndTime: "19:00:00"`) in a real Playwright-driven Chromium session against the real dev API/MySQL → Arrival showed `07:00`, Departure showed `19:00`, both with the "From schedule — confirm or edit" hint, and no `PATCH` fired (`GET /dtr/days/:date` immediately after, without saving, still returned `arrivalTime: null`/`departureTime: null` — AC-004)
- [x] Opened a day with saved `arrivalTime: "07:03:00"`/`departureTime: "18:58:00"` → fields showed `07:03`/`18:58`, no hint (AC-002)
- [x] Opened a `SUSPENDED` day with no saved times → both fields genuinely blank, no hint (AC-003)
- [x] `console --errors` clean across all three page loads

---

## 22. Acceptance Criteria

### AC-001 — Pre-fill on a fresh scheduled day

**Given:** a `REGULAR` day generated by the DTR calendar with `scheduleStartTime: "07:00:00"`, `scheduleEndTime: "19:00:00"`, and no saved arrival/departure.

**When:** the teacher opens that day in the Day Editor.

**Then:** the Arrival field shows `07:00` and the Departure field shows `19:00`, and no `PATCH` request has been sent yet.

### AC-002 — Saved data always wins over the schedule

**Given:** a day that already has `arrivalTime: "07:03:00"` saved.

**When:** the teacher opens that day in the Day Editor.

**Then:** the Arrival field shows `07:03`, not the schedule's `07:00`.

### AC-003 — Non-REGULAR days are never pre-filled

**Given:** a day with `status: SUSPENDED` and no saved arrival/departure.

**When:** the teacher opens that day in the Day Editor.

**Then:** both fields are blank.

### AC-004 — Pre-filled-but-unedited value still requires an explicit Save

**Given:** AC-001's state (fields pre-filled, nothing saved yet).

**When:** the teacher navigates away without clicking Save.

**Then:** `GET /dtr/days/:date` still returns `arrivalTime: null`, `departureTime: null` — the pre-fill never silently persisted.

---

## 23. Implementation Checklist

### Frontend

- [x] Update `useForm`'s `values` computation in `DtrDayEditorPage.tsx`
- [x] Decide and implement the per-field-vs-both-fields pre-fill rule (§15) — per-field
- [x] Visual distinction for pre-filled-not-yet-confirmed state (`TextField`'s new `hint` prop)
- [x] Manual browser verification (§21) — done live via Playwright against real API/MySQL

### Integration

- [x] Confirm `PATCH` payload on Save matches what's visually shown, whether pre-filled-untouched or edited — unchanged code path, `PATCH` still sends whatever the form currently holds regardless of where the value originated

---

## 24. Definition of Done

- [x] AC-001 through AC-004 pass (verified live)
- [x] `tsc -b` and `oxlint` clean
- [x] Confirmed live that an unsaved pre-fill never appears in a `GET` response (AC-004)
- [x] `CLAUDE.md`'s "Daily Attendance & Status editor" note updated to describe the new pre-fill behavior and reference BR-004 the same way this ticket does
- [x] No secrets committed, no debug code left in

---

## 25. Notes / Technical Decisions

### Decision (proposed — confirm before implementing)

Pre-fill is a client-side-only form default. Nothing is persisted until the teacher clicks Save. This is the specific design choice that keeps this ticket compatible with BR-004.

### Reason

BR-004 and its restatements across `docs/business-analysis-project-baseline.md`, `docs/feature(1).md`, `docs/plan(1).md`, and `docs/stack(1).md` are unusually emphatic and repeated for a single rule in this codebase — it's clearly load-bearing for the project's trust model (HR remains the source of attendance truth; the system prepares, the teacher verifies, per the "automate the preparation, not the authority" principle). Any design where a schedule value reaches `dtr_days.arrival_time`/`departure_time` *without* an explicit teacher action in between would cross that line. A pre-filled `<input>` the teacher must still explicitly submit does not.

### Alternatives Considered

- **Auto-save the schedule time as attendance the moment the calendar is generated** (i.e., `dtr/calendar`'s `generate()` sets `arrivalTime`/`departureTime` from the schedule instead of leaving them null) — **rejected**, this is exactly what BR-004 prohibits: the schedule becoming attendance with no verification step at all.
- **Auto-fill and auto-save on blur (leaving the field) without an explicit Save click** — **rejected**, still no meaningful verification gate; a teacher tabbing through fields could commit unverified data.
- **A bulk "apply schedule to all empty days" button that writes many `DtrDay` rows at once** — **deferred, not rejected outright** — plausible future ticket, but a teacher clicking one bulk button *is* arguably still "an explicit action," just a bigger blast radius per click and a materially different (batch-write) implementation. Kept out of this ticket's scope to keep the BR-004 discussion focused on the single-day case first.

### Final Choice

Per-day, client-side-only form pre-fill, confirmed only by the teacher's existing explicit Save action — as specified in §7's functional requirements.

---

## 26. Dependencies

### Required Before This Ticket

- [x] DTR-007 (DTR Calendar Generation) — done, provides `scheduleStartTime`/`scheduleEndTime` on every `DtrDay`
- [x] DTR-008 (Daily Attendance Entry) — done, provides the Day Editor this ticket modifies

### Blocks

- [ ] None

---

## 27. Rollout / Deployment

- [ ] No migration, no environment variable changes
- [ ] Frontend-only change, deploys with the next normal frontend build
- [ ] No rollback plan needed beyond normal git revert
