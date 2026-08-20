# BUG-001 — Stale DTR Excel Download After Editing a Day

> Filled out retroactively using `docs/ticket-base-detailed.md`'s template, after the bug was found in live user testing, root-caused, fixed, and verified in the same session. Sections that don't apply to a frontend-only bug fix (Database Requirements, API Requirements, Backend Implementation) are noted as not applicable rather than padded out.
>
> Numbered `BUG-001`, not `DTR-0XX` — `docs/business-analysis-project-baseline.md` §19's traceability table already reserves DTR-014 through DTR-020 for specific future features (History, Audit Log, Dashboard, OCR, Admin, Testing, Deployment). This isn't a new feature, so it gets its own `BUG-` sequence instead of colliding with that reservation.

---

## 1. Ticket Information

| Field | Value |
|---|---|
| Ticket ID | `BUG-001` |
| Title | Stale DTR Excel Download After Editing a Day |
| Type | Bug |
| Priority | P0 |
| Status | DONE |
| Epic | Teacher DTR Automation System |
| Module | Frontend — `apps/web/src/pages/DtrPeriodDetailPage.tsx` |
| Assignee | — |
| Reviewer | — |
| Estimate | ~30 min (found, root-caused, fixed, and re-verified in one session) |
| Dependencies | DTR-012 (Excel Generator), DTR-013 (Excel Download) — both backend, both unaffected by this fix |
| Related Tickets | None |

---

## 2. Description

### Background

`apps/web`'s DTR Period detail screen (`/dtr/:periodId`) is where a teacher generates and downloads their DTR Excel file (`docs/api/dtr-generation.md`). The screen originally exposed this as two separate buttons: "Generate Excel" (calls `POST /dtr/generate`, producing a new `DtrGeneration` row + file on disk) and, once that succeeded, a "Download {fileName}" button (calls `GET /dtr/generate/:id/download` using the `id` from the *last* generate response).

### Problem

Found during real end-to-end testing by the user (not synthetic/scripted testing): after clicking "Generate Excel," then going back to edit another day's attendance, then clicking the still-visible "Download" button, the downloaded file did not include that later edit. The user reported it as the generated file "not automatically including or entering the daily schedule."

Root-caused by inspecting the live dev database directly (`docker exec ... mysql`) rather than guessing:
- The user's DTR period had 3 `dtr_generations` rows (versions 1–3).
- Version 1 was generated at `14:16:55`, **before** any day had been edited (both real edits happened at `14:21:35` and `14:22:12`) — so version 1 legitimately has no arrival/departure data. That's correct behavior, not a bug.
- Versions 2 and 3 were generated *after* each edit and, when read back directly with ExcelJS, correctly contained the arrival/departure/status data for both edited days.

So the backend and the Excel generator were never wrong. The bug was purely in the frontend: the "Download" button's target (`generateExcelMutation.data`) went stale the moment a day was edited after the last "Generate Excel" click, with no visual indication that it had.

### Proposed Solution

Collapse "Generate Excel" and "Download" into a single action/button that always does `POST /dtr/generate` immediately followed by `GET /dtr/generate/:id/download` on the fresh result. This removes the stale intermediate state entirely — there is no longer a window where a visible "Download" button can point at data older than the teacher's last edit.

### User Impact

Before: a teacher who generated a preview, then went back and fixed a day's time, then clicked the same "Download" button, would get a file silently missing that fix — with no error or warning, since nothing about the request itself failed.

After: every download click always reflects current data. There's no longer a "did I remember to regenerate?" step for the teacher to get wrong.

### Technical Impact

Frontend only. `apps/web/src/pages/DtrPeriodDetailPage.tsx`. No backend change — `POST /dtr/generate` and `GET /dtr/generate/:id/download` (`docs/api/dtr-generation.md`) are unchanged and were confirmed correct throughout.

---

## 3. Objective

Make the DTR Excel download always reflect the DTR period's current data, with no user-visible action sequence that can silently produce a stale file.

---

## 4. Goal

Remove the specific failure mode found in testing (edit-after-generate-then-download-stale-button) without adding new user steps — ideally reducing the step count, which is what the fix does (two clicks → one).

---

## 5. Business Context

Connects to `docs/business-analysis-project-baseline.md`'s core principle: *"The teacher should verify the DTR, not repeatedly rebuild and format the DTR."* A silently-stale download undermines that — the teacher did the right thing (entered correct data) and the tool produced the wrong output anyway, without telling them. NFR-002 ("Generated Excel files must open successfully in Microsoft Excel") is about file validity, which was never at risk here; this bug was about file *currency*, a gap the docs don't explicitly name but is squarely inside "automate the preparation" — the prep has to reflect what was actually verified.

---

## 6. Scope

### In Scope

- [x] Collapse the two-button generate/download flow into one action
- [x] Preserve existing error handling for both the generate step (normal JSON error) and the download step (blob-typed error — see `lib/errors.ts`'s `resolveErrorMessage`)
- [x] Re-verify live against the real data already in the dev database from the original bug report

### Out of Scope

- [ ] A "this download may be stale" warning banner as an alternative design (rejected — see §25, removing the possibility entirely is strictly better than warning about it)
- [ ] Any backend change (none needed — root cause was entirely client-side state staleness)
- [ ] A generation-history list UI (`GET /dtr/generations` is deliberately unbuilt — DTR-014, separate ticket, unrelated to this bug)

### MVP Constraint

No new dependencies, no new backend endpoints. Fix stays inside the existing `DtrPeriodDetailPage.tsx` component and the existing `dtr-generation.md` API contract.

---

## 7. Functional Requirements

### FR-001 — Single generate-and-download action

The DTR Period detail screen shall expose Excel generation and download as one user action, not two independently-clickable buttons with a persisted intermediate state.

### FR-002 — Every download is preceded by a fresh generate

Every time the action is triggered, the system shall call `POST /dtr/generate` and download **that** response's file — never a previously-cached generation result.

---

## 8. Business Rules

### Rule — No stale downloads

```text
A downloaded DTR Excel file must always be the output of a generation
that ran after the most recent edit to that DTR period's day data.
```

This is enforced structurally (no cached generation result can be downloaded independently of a fresh generate call), not by a staleness check/warning.

---

## 9. User Flow

### Before (buggy)

```text
Teacher edits Day A
      ↓
Clicks "Generate Excel"          → DtrGeneration v1 created (has Day A's data)
      ↓
"Download" button appears, bound to v1
      ↓
Teacher edits Day B
      ↓
Teacher clicks "Download" (the SAME button, now stale)
      ↓
Downloads v1 — missing Day B      ← BUG
```

### After (fixed)

```text
Teacher edits Day A
      ↓
Teacher edits Day B
      ↓
Clicks "Generate & Download Excel"
      ↓
POST /dtr/generate  → DtrGeneration v2 created (has both Day A and Day B)
      ↓
GET /dtr/generate/v2/download  → browser downloads v2 immediately
      ↓
Downloaded file has both edits    ← CORRECT
```

### Error Flow

```text
Click "Generate & Download Excel"
      ↓
POST /dtr/generate fails (e.g. period spans >1 month, no profile yet)
      ↓
Error surfaced via getErrorMessage/resolveErrorMessage in an Alert
      ↓
No download attempted (mutationFn short-circuits on the await)
```

---

## 10. UI / UX Requirements

### Page

`/dtr/:periodId` (`DtrPeriodDetailPage.tsx`)

### Components

- [x] Single `Button` — "Generate & Download Excel" (was two: "Generate Excel" + conditional "Download {fileName}")
- [x] `Alert` (error) — shows either the generate-step or download-step failure message
- [x] `Alert` (success) — "Downloaded {fileName} (version {version})." after a successful run

### Required Fields

N/A — this action takes no form input, just the `dtrPeriodId` from the route.

### UI States

#### Loading

Button shows its `isLoading` state (from `generateAndDownloadMutation.isPending`) for the whole generate+download sequence, not just the generate half.

#### Empty

Button is `disabled` when `rows.length === 0` (no calendar generated yet) — unchanged from before.

#### Error

`generateDownloadError` state (set via `onError`, resolved with `resolveErrorMessage` to correctly unwrap a blob-typed download failure) renders in an `Alert`.

#### Success

`generateAndDownloadMutation.isSuccess` renders a success `Alert` naming the file and version actually downloaded.

#### Disabled

Same `rows.length === 0` gate as before; also implicitly disabled while `isPending` (via the `Button` component's existing `isLoading` → `disabled` behavior).

---

## 11. Database Requirements

Not applicable — no schema change. `dtr_generations` continues to accumulate one row per generate call exactly as before (`docs/api/dtr-generation.md`'s `version` field); this fix doesn't change how many rows get created, only how the frontend chooses which one to download.

---

## 12. API Requirements

Not applicable — no API change. Confirmed both endpoints behave exactly as `docs/api/dtr-generation.md` documents:

```text
POST /api/dtr/generate                    (unchanged)
GET  /api/dtr/generate/:id/download       (unchanged)
```

---

## 13. Backend Implementation

Not applicable — no backend files touched.

---

## 14. Frontend Implementation

- [x] Remove `generateExcelMutation` and `downloadMutation` (two separate `useMutation`s)
- [x] Add `generateAndDownloadMutation` — single `useMutation` whose `mutationFn` awaits `generateDtrExcel()` then `downloadDtrExcel()` and returns the generation
- [x] Remove the conditional "Download {fileName}" button
- [x] Rename the remaining button to "Generate & Download Excel"
- [x] Replace `downloadError` state with `generateDownloadError`, set via `onError` using the existing `resolveErrorMessage` helper (already handled the blob-typed-error case correctly — no change needed there)
- [x] Add a success `Alert` confirming what was downloaded (file name + version) — new, wasn't present before since success was previously implied by the Download button just being visible
- [x] `tsc -b` / `oxlint` clean

---

## 15. Validation and Edge Cases

### Input

- [x] No day data entered yet → generate produces a file with all days blank (correct, matches version 1 in the live test data — not a bug)
- [x] Day edited, then generate-and-download clicked once → edit is present (re-verified live, see §21)
- [x] Multiple edits across multiple days before one generate-and-download click → all edits present (implied by the fix; the mutation always reads current server state at call time)

### Business

- [x] Regenerating the same period bumps `version` and creates a new file rather than overwriting the previous one (existing DTR-012 behavior, unaffected)
- [x] A rejected generate (e.g. cross-month period, no teacher profile) shows the error and never attempts a download (`mutationFn`'s `await generateDtrExcel()` throws before reaching the download line)

### Boundary

- [ ] Not explicitly tested: two teachers' browser tabs racing generate calls for the *same* period at the same time — out of scope, no evidence this occurs in practice for a single-teacher tool

---

## 16. DTR-Specific Validation

Not applicable — this bug and fix are about *which generated file gets downloaded*, not about DTR day-level data validation (arrival/departure/status), which is unchanged and covered by `docs/api/dtr-validation.md` / `dtr-days.md`.

---

## 17. Excel Template Requirements

Not applicable — no change to `dtr/generator/dtr-excel-mapper.ts` or the master template. Confirmed unaffected: re-inspected the live-tested output files directly with ExcelJS during root-causing and found the cell mapping was already correct in every version.

---

## 18. Security Requirements

- [x] No change to authentication/authorization — `resolveDownload`'s ownership check (`docs/api/dtr-generation.md`) is untouched
- [x] No new data exposed to the client beyond what was already returned by `POST /dtr/generate`

---

## 19. Performance Requirements

Generate-and-download now happens as two sequential awaited requests instead of two independently-clicked ones — negligible added latency (both requests already completed in well under a second in live testing), and it removes a full user click+wait cycle from the happy path, which is a net UX improvction, not just neutral.

---

## 20. Error Handling

### Frontend

- [x] Generate-step failure (normal JSON `{ success: false, message, errors }`) → readable message via `getErrorMessage`
- [x] Download-step failure (blob-typed response body) → readable message via `resolveErrorMessage`, which reads the Blob as text and `JSON.parse`s it — this handling already existed from DTR-013's frontend work and needed no changes
- [x] Error state is cleared on each new attempt (`onMutate: () => setGenerateDownloadError(null)`)

---

## 21. Testing

### Root-cause verification (before the fix)

- [x] Queried the live dev MySQL database directly (`docker exec ... mysql`) to inspect the actual `dtr_days` and `dtr_generations` rows from the user's real test session
- [x] Confirmed via timestamps that generation v1 predated both real day edits (correctly blank) and v2/v3 postdated them
- [x] Read generation v3's actual file bytes back with ExcelJS and confirmed both edited days' arrival/departure/status were present and correct — proved the backend/generator were never at fault

### Fix verification (after the fix)

- [x] `npm run build` (`tsc -b && vite build`) — clean
- [x] `npm run lint` (`oxlint`) — clean
- [x] Live reproduction: `PATCH`'d a day's arrival/departure (simulating "edit after a previous generate"), called `POST /dtr/generate` then immediately `GET /dtr/generate/:id/download` (the exact sequence the fixed button now performs), and read the downloaded bytes back with ExcelJS — the new edit (`E40`/`H40` for the edited date) was present and correct

### Not (yet) covered

- [ ] No automated frontend test (unit or e2e) added for this — `apps/web` has no test runner configured yet (only `tsc`/`oxlint`); adding one is out of scope for this bug fix

---

## 22. Acceptance Criteria

### AC-001 — Edit-then-download reflects the edit

**Given:** a teacher has previously generated a DTR Excel file for a period.

**When:** they edit another day's attendance and then click "Generate & Download Excel".

**Then:** the downloaded file includes that edit (verified live via ExcelJS read-back).

### AC-002 — No separate stale button exists

**Given:** the DTR Period detail screen.

**When:** a teacher has not yet clicked "Generate & Download Excel".

**Then:** there is no visible "Download" control that could reference outdated data — only the single combined action, disabled until the calendar has at least one day.

### AC-003 — Errors from either step are surfaced

**Given:** `POST /dtr/generate` or `GET /dtr/generate/:id/download` fails.

**When:** the teacher clicks "Generate & Download Excel".

**Then:** a readable error message appears (both the normal-JSON and blob-typed error shapes are handled), and no partial/corrupt download occurs.

---

## 23. Implementation Checklist

### Frontend

- [x] Replace two mutations with one combined mutation
- [x] Update button markup/label
- [x] Update error-state variable and its Alert
- [x] Add success confirmation Alert
- [x] Typecheck + lint clean

### Integration

- [x] Re-verified against the real backend (`POST /dtr/generate` → `GET /dtr/generate/:id/download`) — no backend changes needed or made

---

## 24. Definition of Done

- [x] Root cause identified and confirmed (not guessed) via direct database/file inspection
- [x] Fix implemented in `DtrPeriodDetailPage.tsx`
- [x] `tsc -b` and `oxlint` clean
- [x] Fix re-verified live against a reproduction of the exact failure sequence
- [x] `CLAUDE.md`'s "Frontend (apps/web)" section updated with the bug, root cause, and fix
- [x] This ticket written up
- [ ] Code reviewed by a second person (n/a — single-developer session)
- [x] No secrets committed, no debug code left in

---

## 25. Notes / Technical Decisions

### Decision

Collapse generate+download into one action, rather than keeping them separate and adding a "this file may be outdated" warning banner tied to whether any day has been edited since the last generate.

### Reason

A warning still requires the teacher to notice it and take a second action (regenerate) correctly. Removing the two-step sequence entirely removes the failure mode instead of flagging it — strictly more robust, and it's also fewer clicks for the common case, not a tradeoff.

### Alternatives Considered

- **Warning banner on stale download** — rejected; still relies on the teacher noticing and acting correctly, same class of failure just with an extra hint.
- **Auto-regenerate silently in the background whenever a day changes, keep two buttons** — rejected; adds background write traffic (extra `dtr_generations` rows/files per keystroke-adjacent save) for no benefit over just generating on demand at download time.
- **Disable "Download" and force a "Regenerate" click if any day was touched since the last generate** — rejected; more UI state to track (would need to diff calendar data against the last generation's timestamp) for a worse outcome than simply always regenerating.

### Final Choice

Single combined "Generate & Download Excel" action, as implemented.

---

## 26. Dependencies

### Required Before This Ticket

- [x] DTR-012 (Excel Generator) — done
- [x] DTR-013 (Excel Download) — done

### Blocks

- [ ] None

---

## 27. Rollout / Deployment

- [ ] No migration, no environment variable changes, no template changes
- [x] Change is contained to one frontend component; deploys with the next normal frontend build
- [ ] No rollback plan needed beyond normal git revert (no data migration involved)
