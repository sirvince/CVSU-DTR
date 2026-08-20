# Ticket Base — Detailed Engineering Template

> Standard ticket template for the Teacher DTR Automation System.
>
> Every implementation ticket should clearly explain **what**, **why**, **how**, **scope**, and **how we know it is finished**.

---

# 1. Ticket Information

| Field | Value |
|---|---|
| Ticket ID | `DTR-XXX` |
| Title | `[Clear action-oriented title]` |
| Type | Feature / Bug / Task / Enhancement / Chore |
| Priority | P0 / P1 / P2 / P3 |
| Status | TODO / IN PROGRESS / BLOCKED / REVIEW / DONE |
| Epic | Teacher DTR Automation System |
| Module | `[Auth / Schedule / DTR / Excel / etc.]` |
| Assignee | `[Developer]` |
| Reviewer | `[Reviewer]` |
| Estimate | `[Hours / Story Points]` |
| Dependencies | `[Ticket IDs / None]` |
| Related Tickets | `[Ticket IDs / None]` |

---

# 2. Description

## Background

[Explain the current process or technical situation.]

## Problem

[Explain the specific problem this ticket is solving.]

## Proposed Solution

[Explain what the system should do.]

## User Impact

[Explain how this changes or improves the user's workflow.]

## Technical Impact

[Explain which modules, database tables, APIs, files, or components are affected.]

---

# 3. Objective

State the specific outcome that this ticket must accomplish.

> Example:
>
> Implement the teacher weekly schedule module so teachers can configure their expected duty schedule for a selected academic period.

---

# 4. Goal

State the business/product outcome.

> Example:
>
> Allow teachers to configure their schedule once so the system can automatically generate scheduled DTR dates and use the schedule as context during DTR validation.

---

# 5. Business Context

## Current Process

```text
HR
 ↓
Attendance Record
 ↓
Teacher
 ↓
Manual Excel Encoding
 ↓
Manual Checking
 ↓
Print
```

## Problem

- Manual data transfer
- Repetitive encoding
- Repetitive formatting
- Higher chance of encoding errors
- DTR preparation delays

## Target Process

```text
HR
 ↓
Attendance / DTR Details
 ↓
Teacher DTR System
 ↓
Verify / Correct
 ↓
Generate Existing DTR Excel
 ↓
Print
```

---

# 6. Scope

## In Scope

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## Out of Scope

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## MVP Constraint

[Explain what must remain simple for the MVP.]

Example:

> The MVP only supports one Arrival and one Departure per day. It does not support AM/PM attendance pairs.

---

# 7. Functional Requirements

### FR-001 — [Requirement]

[Detailed functional requirement.]

### FR-002 — [Requirement]

[Detailed functional requirement.]

### FR-003 — [Requirement]

[Detailed functional requirement.]

---

# 8. Business Rules

Document rules that affect system behavior.

### Rule Example

```text
A teacher schedule belongs to an academic period.
```

### Rule Example

```text
A DTR day has at most one Arrival and one Departure.
```

### Rule Example

```text
Schedule is expected duty information and must not automatically become actual attendance.
```

### Rule Example

```text
The system must not determine payroll eligibility unless an official policy is explicitly configured.
```

---

# 9. User Flow

## Main Flow

```text
Step 1
  ↓
Step 2
  ↓
Step 3
  ↓
Expected Result
```

## Alternative Flow

```text
Normal Flow
    ↓
Exception
    ↓
Alternative Action
    ↓
Expected Result
```

## Error Flow

```text
Invalid Input
    ↓
Validation
    ↓
Error Message
    ↓
User Corrects Input
```

---

# 10. UI / UX Requirements

## Page

`[Page name]`

## Components

- [ ] Component 1
- [ ] Component 2
- [ ] Component 3

## Required Fields

| Field | Type | Required | Validation |
|---|---|---:|---|
| Field 1 | Text | Yes | Rule |
| Field 2 | Time | Yes | Rule |
| Field 3 | Select | No | Rule |

## UI States

### Loading

[Expected loading behavior.]

### Empty

[Expected empty-state behavior.]

### Error

[Expected error-state behavior.]

### Success

[Expected success behavior.]

### Disabled

[When controls should be disabled.]

---

# 11. Database Requirements

## Tables Affected

- `[table_name]`
- `[table_name]`

## Schema

```text
table_name
-------------------------
id
field_1
field_2
created_at
updated_at
```

## Relationships

```text
Teacher
   │
   └── Academic Period
          │
          └── Schedule
```

## Constraints

- [ ] Foreign keys
- [ ] Unique constraints
- [ ] Required fields
- [ ] Indexes
- [ ] Soft delete if required

## Migration

- [ ] Create migration
- [ ] Run migration
- [ ] Verify rollback
- [ ] Verify production compatibility

---

# 12. API Requirements

## Endpoint

```text
METHOD /api/resource
```

### Authentication

```text
Required: YES / NO
Role: TEACHER / ADMIN / PUBLIC
```

### Request

```json
{
  "field": "value"
}
```

### Response

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

## API Validation

- [ ] Required fields
- [ ] Data type
- [ ] Date/time format
- [ ] Ownership
- [ ] Authorization
- [ ] Duplicate handling
- [ ] Business rules

---

# 13. Backend Implementation

- [ ] Entity
- [ ] DTO
- [ ] Repository
- [ ] Service
- [ ] Controller
- [ ] Validation
- [ ] Authorization
- [ ] Exception handling
- [ ] Logging
- [ ] Unit tests
- [ ] API tests

---

# 14. Frontend Implementation

- [ ] Page
- [ ] Route
- [ ] API service
- [ ] Query
- [ ] Mutation
- [ ] Form
- [ ] Validation schema
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Success feedback
- [ ] Responsive layout

---

# 15. Validation and Edge Cases

Document all expected edge cases.

### Input

- [ ] Empty value
- [ ] Invalid value
- [ ] Invalid time
- [ ] Invalid date
- [ ] Duplicate record

### Authorization

- [ ] User owns record
- [ ] User cannot access another teacher's record
- [ ] Unauthorized request rejected

### Business

- [ ] Record outside academic period
- [ ] Record outside DTR period
- [ ] Conflicting schedule
- [ ] Missing attendance
- [ ] Special status

### Boundary

- [ ] First day of month
- [ ] Last day of month
- [ ] Semester boundary
- [ ] Year boundary

---

# 16. DTR-Specific Validation

For DTR tickets, consider:

- [ ] Arrival missing
- [ ] Departure missing
- [ ] Arrival after Departure
- [ ] Arrival outside expected schedule
- [ ] Departure outside expected schedule
- [ ] Online status
- [ ] Suspended status
- [ ] Holiday status
- [ ] No-class status
- [ ] Remarks requirement
- [ ] Official policy treatment

Important:

> Validation should identify inconsistencies. It should not automatically make payroll or employment decisions unless an approved rule explicitly requires it.

---

# 17. Excel Template Requirements

For tickets involving DTR generation:

## Template

```text
storage/templates/dtr/DTR-FORMAT-MASTER.xlsx
```

## Mapping

| Data | Excel Location |
|---|---|
| Teacher Name | `[cell]` |
| Period | `[cell]` |
| Date | `[cell/range]` |
| Arrival | `[cell/range]` |
| Departure | `[cell/range]` |
| Remarks | `[cell/range]` |

## Requirements

- [ ] Load existing template
- [ ] Do not modify master file
- [ ] Populate teacher information
- [ ] Populate dates
- [ ] Populate Arrival
- [ ] Populate Departure
- [ ] Preserve formatting
- [ ] Preserve merged cells
- [ ] Preserve formulas
- [ ] Preserve sheet structure
- [ ] Generate new file
- [ ] Verify workbook opens successfully

---

# 18. Security Requirements

- [ ] Authentication required
- [ ] Authorization required
- [ ] Teacher ownership validation
- [ ] Input validation
- [ ] No sensitive information in logs
- [ ] No secrets in source code
- [ ] Environment variables used
- [ ] File validation for uploads
- [ ] Rate limiting where applicable
- [ ] Audit important changes

---

# 19. Performance Requirements

Document expected behavior.

Example:

```text
DTR calendar generation:
< 1 second for a normal monthly period
```

```text
Excel generation:
< 3 seconds for a normal DTR workbook
```

Avoid premature optimization for the MVP.

---

# 20. Error Handling

## Backend

- [ ] Use appropriate HTTP status
- [ ] Return meaningful error message
- [ ] Log unexpected errors
- [ ] Do not expose stack traces to users

## Frontend

- [ ] Display readable error
- [ ] Preserve entered form data where possible
- [ ] Allow retry
- [ ] Disable duplicate submission

---

# 21. Testing

## Unit Tests

- [ ] Business logic
- [ ] Validation
- [ ] Date calculations
- [ ] Time calculations
- [ ] Status handling

## Integration Tests

- [ ] Database
- [ ] API
- [ ] Authentication
- [ ] Authorization

## E2E Tests

- [ ] User login
- [ ] Create schedule
- [ ] Generate DTR calendar
- [ ] Enter attendance
- [ ] Mark exception
- [ ] Review DTR
- [ ] Generate Excel
- [ ] Download Excel

---

# 22. Acceptance Criteria

Use Given / When / Then.

## AC-001 — [Criterion]

**Given:** [Initial state]

**When:** [Action]

**Then:** [Expected result]

---

## AC-002 — [Criterion]

**Given:** [Initial state]

**When:** [Action]

**Then:** [Expected result]

---

## AC-003 — [Criterion]

**Given:** [Initial state]

**When:** [Action]

**Then:** [Expected result]

---

# 23. Implementation Checklist

## Backend

- [ ] Entity
- [ ] Migration
- [ ] DTO
- [ ] Repository
- [ ] Service
- [ ] Controller
- [ ] Validation
- [ ] Authorization
- [ ] Tests

## Frontend

- [ ] Page
- [ ] Component
- [ ] Form
- [ ] API integration
- [ ] Validation
- [ ] Loading state
- [ ] Error state
- [ ] Success state
- [ ] Tests

## Integration

- [ ] Frontend ↔ API
- [ ] API ↔ Database
- [ ] DTR domain ↔ Excel generator
- [ ] Authentication ↔ protected resources

---

# 24. Definition of Done

A ticket is DONE only when:

- [ ] Requirements implemented
- [ ] Scope respected
- [ ] Database changes completed
- [ ] API completed
- [ ] Frontend completed
- [ ] Validation implemented
- [ ] Authorization implemented
- [ ] Error handling implemented
- [ ] Tests completed
- [ ] Acceptance criteria passed
- [ ] No critical bugs
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No debug code remains
- [ ] No secrets committed
- [ ] Feature verified in the target environment

---

# 25. Notes / Technical Decisions

## Decision

[Decision made.]

## Reason

[Why this decision was made.]

## Alternatives Considered

- Option A
- Option B
- Option C

## Final Choice

[Selected option.]

---

# 26. Dependencies

### Required Before This Ticket

- [ ] DTR-XXX
- [ ] DTR-XXX

### Blocks

- [ ] DTR-XXX
- [ ] DTR-XXX

---

# 27. Rollout / Deployment

- [ ] Database migration ready
- [ ] Environment variables updated
- [ ] Template deployed
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Smoke test completed
- [ ] Rollback plan confirmed

---

# 28. Example — DTR-005 Teacher Schedule

## Ticket Information

**Ticket ID:** DTR-005  
**Title:** Teacher Weekly Schedule  
**Type:** Feature  
**Priority:** P0  
**Status:** TODO  
**Epic:** Teacher DTR Automation System  
**Module:** Schedule  
**Dependencies:** DTR-004 — Academic Period

---

## Description

Implement the teacher weekly schedule module.

The teacher needs to configure their expected duty schedule for the selected academic period.

The MVP intentionally keeps the schedule simple. Only the following information is required:

```text
Day of Week
Start Time
End Time
```

Example:

```text
Monday     07:00 AM - 07:00 PM
Tuesday    07:00 AM - 07:00 PM
Wednesday  07:00 AM - 07:00 PM
Thursday   07:00 AM - 07:00 PM
Friday     07:00 AM - 07:00 PM
```

The MVP does not require:

- Subject
- Room
- Section
- Course
- Teaching mode

The schedule will be used by the DTR calendar to determine which dates are normally scheduled.

The schedule must not automatically become the teacher's actual attendance.

```text
Expected Schedule
       ≠
Actual Attendance
```

---

## Objective

Allow teachers to configure their expected weekly duty schedule for an academic period.

---

## Goal

Allow the system to automatically determine scheduled DTR dates so teachers do not need to repeatedly recreate their expected schedule for every DTR period.

---

## Business Context

### Current

```text
Teacher receives HR DTR details
        ↓
Teacher manually prepares DTR
        ↓
Teacher manually checks dates
        ↓
Teacher prints
```

### Target

```text
Teacher configures weekly schedule once
        ↓
System generates DTR calendar
        ↓
Teacher enters/verifies Arrival + Departure
        ↓
System generates DTR Excel
```

---

## Scope

### In Scope

- [ ] Create weekly schedule
- [ ] Select day of week
- [ ] Set start time
- [ ] Set end time
- [ ] Edit schedule
- [ ] Delete schedule
- [ ] Associate schedule with academic period
- [ ] Retrieve schedule for DTR calendar
- [ ] Validate start/end time
- [ ] Restrict schedule access to owner

### Out of Scope

- [ ] Subject management
- [ ] Room management
- [ ] Section management
- [ ] Biometric integration
- [ ] HR integration
- [ ] Payroll computation
- [ ] Automatic suspension detection

---

## Business Rules

### BR-001

A schedule belongs to one teacher and one academic period.

### BR-002

A schedule contains one day of week and one expected time range.

### BR-003

Start time must be earlier than end time.

### BR-004

Teacher can only manage their own schedules.

### BR-005

A schedule is reference information and must not automatically populate Arrival or Departure.

### BR-006

A schedule may be used by DTR calendar generation.

---

## Database

### `teacher_schedules`

```text
id
teacher_id
academic_period_id
day_of_week
start_time
end_time
created_at
updated_at
```

### Relationships

```text
Teacher
   │
   └── Academic Period
          │
          └── Teacher Schedule
```

---

## API

```text
GET    /api/schedules
POST   /api/schedules
PATCH  /api/schedules/:id
DELETE /api/schedules/:id
```

### Create Request

```json
{
  "academicPeriodId": "period-id",
  "dayOfWeek": "MONDAY",
  "startTime": "07:00",
  "endTime": "19:00"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "schedule-id",
    "dayOfWeek": "MONDAY",
    "startTime": "07:00",
    "endTime": "19:00"
  },
  "message": "Schedule created successfully"
}
```

---

## UI

### Weekly Schedule

```text
Weekly Schedule
1st Semester 2026–2027

Monday
07:00 AM - 07:00 PM
[Edit] [Delete]

Tuesday
07:00 AM - 07:00 PM
[Edit] [Delete]

Wednesday
No Schedule
[Add Schedule]

Thursday
07:00 AM - 07:00 PM
[Edit] [Delete]

Friday
07:00 AM - 07:00 PM
[Edit] [Delete]
```

### Add Schedule

```text
Day
[ Monday ▼ ]

Start Time
[ 07:00 AM ]

End Time
[ 07:00 PM ]

[ Cancel ] [ Save ]
```

---

## Validation

### Invalid Time

```text
Start: 07:00 PM
End:   07:00 AM
```

Result:

```text
Error:
End time must be later than start time.
```

### Duplicate Schedule

If Monday already has a schedule:

```text
Warning:
A Monday schedule already exists for this academic period.
```

The system should prevent accidental duplicates unless multiple schedule ranges are intentionally supported later.

---

## Acceptance Criteria

### AC-001 — Create Schedule

**Given:** The teacher has an active academic period.

**When:** The teacher creates Monday from 07:00 AM to 07:00 PM.

**Then:** The schedule is saved and displayed in the weekly schedule.

### AC-002 — Edit Schedule

**Given:** A Monday schedule exists.

**When:** The teacher changes it to 08:00 AM–06:00 PM.

**Then:** The system updates the existing schedule.

### AC-003 — Delete Schedule

**Given:** A Monday schedule exists.

**When:** The teacher deletes it.

**Then:** Monday displays as having no schedule.

### AC-004 — Invalid Time

**Given:** The teacher is creating a schedule.

**When:** End time is earlier than start time.

**Then:** The system rejects the request and displays a validation message.

### AC-005 — Teacher Ownership

**Given:** Teacher A is logged in.

**When:** Teacher A requests schedules.

**Then:** Only Teacher A's schedules are returned.

### AC-006 — Academic Period

**Given:** Teacher has two academic periods.

**When:** Teacher selects the current academic period.

**Then:** Only schedules belonging to that academic period are displayed.

### AC-007 — DTR Calendar Integration

**Given:** Teacher has Monday 07:00 AM–07:00 PM configured.

**When:** A DTR period contains a Monday date.

**Then:** The DTR calendar identifies that date as scheduled and displays the expected schedule.

---

## Implementation Tasks

### Database

- [ ] Create `teacher_schedules` migration
- [ ] Add foreign key to teacher
- [ ] Add foreign key to academic period
- [ ] Add day-of-week field
- [ ] Add start time
- [ ] Add end time
- [ ] Add timestamps
- [ ] Add appropriate indexes/constraints

### Backend

- [ ] Create entity
- [ ] Create DTO
- [ ] Create service
- [ ] Create controller
- [ ] Implement CRUD
- [ ] Implement ownership validation
- [ ] Implement academic-period filtering
- [ ] Implement time validation
- [ ] Implement duplicate protection
- [ ] Add tests

### Frontend

- [ ] Create schedule page
- [ ] Create weekly schedule view
- [ ] Create add schedule form
- [ ] Create edit schedule form
- [ ] Add delete confirmation
- [ ] Add loading state
- [ ] Add empty state
- [ ] Add validation messages
- [ ] Add success/error feedback
- [ ] Add API integration

### Integration

- [ ] Connect schedule API to DTR calendar
- [ ] Verify scheduled dates
- [ ] Verify unscheduled dates
- [ ] Verify academic-period filtering

---

## Testing

### Unit

- [ ] Start/end time validation
- [ ] Duplicate detection
- [ ] Day-of-week handling

### API

- [ ] Create
- [ ] Read
- [ ] Update
- [ ] Delete
- [ ] Unauthorized access
- [ ] Wrong teacher access
- [ ] Wrong academic period

### E2E

- [ ] Login
- [ ] Select academic period
- [ ] Add schedule
- [ ] Edit schedule
- [ ] Delete schedule
- [ ] Open DTR calendar
- [ ] Confirm schedule appears

---

## Definition of Done

- [ ] Database migration completed
- [ ] Entity implemented
- [ ] CRUD API implemented
- [ ] Authorization implemented
- [ ] Frontend implemented
- [ ] Validation implemented
- [ ] DTR calendar integration completed
- [ ] Unit tests passed
- [ ] API tests passed
- [ ] E2E flow verified
- [ ] Acceptance criteria passed
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No critical bugs
