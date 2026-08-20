# Teacher DTR Automation System — Project Plan

## 1. Project Overview

The Teacher DTR Automation System is a teacher-side web application designed to reduce repetitive manual encoding and delays in preparing the Daily Time Record (DTR).

The system will **not replace or modify the existing HR attendance process**.

The existing HR workflow remains:

```text
Biometric / Time-in Device
        ↓
HR exports attendance records
        ↓
HR distributes attendance / DTR details
        ↓
Teacher receives the record
```

The system starts from the teacher side:

```text
HR DTR Details
      ↓
Teacher DTR System
      ↓
Teacher verifies Arrival / Departure
      ↓
System handles daily status
      ↓
DTR Excel is generated automatically
      ↓
Teacher downloads and prints
```

## 2. Main Objective

Reduce the time and effort required for faculty members to prepare DTRs by changing the process from:

> Manual DTR encoding and formatting

to:

> DTR verification and automatic Excel generation.

## 3. Core Product Principle

> **The teacher should verify the DTR, not repeatedly rebuild the DTR.**

The system removes repetitive work while keeping the teacher responsible for the accuracy of the final DTR.

## 4. Important Simplification

The MVP intentionally keeps the data model simple.

### Teacher Schedule

Only the expected duty schedule is required.

Example:

```text
Monday    07:00 AM - 07:00 PM
Tuesday   07:00 AM - 07:00 PM
Wednesday 07:00 AM - 07:00 PM
Thursday  07:00 AM - 07:00 PM
Friday    07:00 AM - 07:00 PM
```

No subject, room, section, or teaching mode is required for the MVP.

### Daily Attendance

Only one arrival and one departure are recorded per day.

```text
Arrival
Departure
```

The MVP does not use separate AM/PM attendance pairs.

### Daily Status

A date can also have a special status such as:

```text
REGULAR
ONLINE
SUSPENDED
HOLIDAY
NO_CLASS
OTHER
```

## 5. Scope

### MVP

- Teacher authentication
- Teacher profile
- Academic period
- Weekly schedule
- Automatic DTR calendar
- One Arrival and one Departure per day
- Daily status / exception
- Remarks
- Basic validation
- DTR preview
- Existing DTR Excel template generation
- Download generated Excel

### Future

- OCR from DTR paper
- Camera/photo capture
- Supporting document upload
- Admin dashboard
- DTR history/versioning
- Notifications
- Advanced reporting
- HR integration

## 6. User Workflow

```text
Login
  ↓
Teacher Profile
  ↓
Select Academic Period
  ↓
Enter Weekly Schedule
  ↓
System Generates DTR Calendar
  ↓
Receive DTR Details from HR
  ↓
Enter Arrival / Departure
  ↓
Mark Online / Suspended / Holiday / Other when applicable
  ↓
Review and Validate
  ↓
Generate DTR Excel
  ↓
Download
  ↓
Print
```

## 7. Schedule Concept

A schedule belongs to a teacher and an academic period.

Example:

```text
Monday → 07:00 - 19:00
Tuesday → 07:00 - 19:00
Wednesday → 07:00 - 19:00
```

The schedule is used to determine whether a date is a scheduled day and to provide context during DTR review.

It is **not automatically copied as actual attendance**.

```text
Schedule
   ≠
Actual Attendance
```

## 8. Daily DTR Record

Each scheduled date has a daily record.

Example:

```text
Date: August 17

Schedule:
07:00 AM - 07:00 PM

Status:
REGULAR

Arrival:
07:03 AM

Departure:
06:58 PM
```

For a suspension:

```text
Date: August 20

Schedule:
07:00 AM - 07:00 PM

Status:
SUSPENDED

Arrival:
—

Departure:
—

Reason:
Class Suspension
```

The exact DTR treatment for special statuses should follow the school's official rules.

## 9. Recommended Data Entities

```text
User
TeacherProfile
AcademicPeriod
TeacherSchedule
DTRPeriod
DTRDay
DTRGeneration
AuditLog
```

The MVP does not need a complex subject/class entity.

## 10. Development Phases

### Phase 1 — Foundation

- Project setup
- Database
- Authentication
- Teacher profile
- Academic period

### Phase 2 — Schedule

- Weekly schedule CRUD
- Start/end time
- Day-of-week handling
- Automatic DTR calendar generation

### Phase 3 — DTR

- DTR period
- Daily records
- Arrival
- Departure
- Daily status
- Remarks
- Basic validation

### Phase 4 — Excel Generator

- Load existing DTR template
- Populate teacher information
- Populate dates
- Populate Arrival
- Populate Departure
- Preserve template formatting
- Generate downloadable workbook

### Phase 5 — Testing

Test:

- Normal scheduled day
- Missing Arrival
- Missing Departure
- Late Arrival
- Early Departure
- Online day
- Suspended day
- Holiday
- No class
- Weekend
- Month boundary
- DTR template generation

### Phase 6 — OCR Enhancement

After the MVP is stable:

```text
DTR Paper
   ↓
Camera / Upload
   ↓
OCR
   ↓
Extract Arrival / Departure
   ↓
Teacher Verification
   ↓
DTR
```

## 11. Success Criteria

A teacher should be able to:

1. Configure their weekly schedule once.
2. Select a DTR period.
3. Automatically see scheduled dates.
4. Enter Arrival and Departure from the HR-provided record.
5. Mark special daily statuses.
6. Review the DTR.
7. Generate the existing official DTR Excel template.
8. Download and print the DTR.

## 12. Non-Goals for MVP

The MVP will not:

- Connect to the biometric device
- Connect directly to HR's database
- Replace HR's attendance process
- Automatically determine payroll eligibility
- Automatically declare a suspension
- Automatically decide whether a status is payable
- Require HR to create an account
- Require HR to change its existing workflow
