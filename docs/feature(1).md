# Teacher DTR Automation System — Feature Specification

## 1. Authentication

### Teacher Login

Teachers can securely log into their own accounts.

MVP fields:

- Username or email
- Password

Future:

- CVSU institutional login
- Password reset
- Single Sign-On

---

## 2. Teacher Profile

Stores the information required to populate the official DTR.

Possible fields:

- Employee ID
- First Name
- Middle Name
- Last Name
- Position
- Department
- Campus
- Other required DTR information

The profile is reused across DTR periods.

---

## 3. Academic Period

Teacher selects the academic period.

Example:

```text
Academic Year: 2026–2027
Semester: 1st Semester
Start Date: August 2026
End Date: January 2027
```

Schedules and DTR periods belong to an academic period.

---

## 4. Weekly Teacher Schedule

### Purpose

The schedule tells the system which days are normally scheduled and the expected duty window.

The MVP only needs:

- Day of week
- Start time
- End time

Example:

| Day | Start | End |
|---|---:|---:|
| Monday | 07:00 AM | 07:00 PM |
| Tuesday | 07:00 AM | 07:00 PM |
| Wednesday | 07:00 AM | 07:00 PM |
| Thursday | 07:00 AM | 07:00 PM |
| Friday | 07:00 AM | 07:00 PM |

A teacher can leave a day without a schedule.

### Important

No subject, room, section, or class mode is required for the MVP.

The schedule is an expected schedule, not actual attendance.

---

## 5. DTR Calendar

The system automatically generates the DTR calendar from the weekly schedule and selected DTR period.

Example:

```text
August 2026

Aug 17  Monday     07:00–19:00
Aug 18  Tuesday    07:00–19:00
Aug 19  Wednesday  07:00–19:00
Aug 20  Thursday   07:00–19:00
Aug 21  Friday     07:00–19:00
```

The teacher does not need to manually create each scheduled date.

---

## 6. Daily Attendance

Each day uses only one Arrival and one Departure.

```text
Date: August 17

Arrival:   07:03 AM
Departure: 06:58 PM
```

The MVP does not use:

```text
AM IN
AM OUT
PM IN
PM OUT
```

There is only:

```text
ARRIVAL
DEPARTURE
```

This matches the actual DTR process described for the project.

---

## 7. Daily Status / Exception

A scheduled date can have a different status.

Suggested values:

```text
REGULAR
ONLINE
SUSPENDED
HOLIDAY
NO_CLASS
OTHER
```

The exact list can be adjusted to match official school requirements.

### Example — Regular

```text
Date: August 17

Schedule:
07:00 AM – 07:00 PM

Status:
REGULAR

Arrival:
07:03 AM

Departure:
06:58 PM
```

### Example — Online

```text
Date: August 18

Schedule:
07:00 AM – 07:00 PM

Status:
ONLINE

Remarks:
Classes conducted online
```

### Example — Suspended

```text
Date: August 20

Schedule:
07:00 AM – 07:00 PM

Status:
SUSPENDED

Reason:
Class Suspension

Remarks:
Classes suspended due to weather
```

The system should not hardcode that a particular status is payable. DTR treatment must follow the school's official policy.

---

## 8. DTR Day Editor

A date can be opened and edited.

Example:

```text
August 20, 2026

Schedule
07:00 AM – 07:00 PM

Status
[SUSPENDED]

Reason
[Class Suspension]

Arrival
[          ]

Departure
[          ]

Remarks
[Classes suspended due to weather]

[ SAVE ]
```

For a regular day:

```text
August 21, 2026

Schedule
07:00 AM – 07:00 PM

Status
[REGULAR]

Arrival
[07:02 AM]

Departure
[06:59 PM]

Remarks
[          ]

[ SAVE ]
```

---

## 9. Attendance Validation

The system performs basic checks.

### Missing Arrival

```text
Arrival: —
Departure: 06:59 PM

Warning: Missing Arrival
```

### Missing Departure

```text
Arrival: 07:02 AM
Departure: —

Warning: Missing Departure
```

### Invalid Time

```text
Arrival: 99:90

Error: Invalid time
```

### Schedule Comparison

Example:

```text
Schedule:
07:00 AM – 07:00 PM

Actual:
07:35 AM – 06:00 PM
```

The system can show:

```text
Warning:
Arrival is later than scheduled start.

Warning:
Departure is earlier than scheduled end.
```

These should be warnings for teacher review, not automatic payroll decisions.

---

## 10. DTR Preview

The preview should match the actual one-arrival/one-departure workflow.

Example:

```text
Day | Arrival | Departure | Status
------------------------------------
17  | 07:03   | 18:58     | REGULAR
18  |         |           | ONLINE
19  | 07:30   | 18:55     | REGULAR
20  |         |           | SUSPENDED
21  | 07:02   | 19:01     | REGULAR
```

The final preview should be based on verified data.

---

## 11. Existing DTR Excel Template Generator

The system must use the school's existing DTR workbook as the output template.

### Generator responsibilities

- Load master DTR template
- Populate teacher information
- Populate DTR period
- Populate dates
- Populate Arrival
- Populate Departure
- Populate applicable remarks/status information
- Preserve formatting
- Preserve merged cells
- Preserve borders
- Preserve formulas where applicable
- Generate a new workbook

The master template must never be modified directly.

---

## 12. DTR Generation

Teacher clicks:

```text
[ Generate DTR ]
```

System performs:

```text
Verified DTR
    ↓
DTR Generator
    ↓
Existing Excel Template
    ↓
Populate records
    ↓
Generate XLSX
```

Example output:

```text
DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx
```

---

## 13. DTR History

Future/P1 feature.

Store:

- Teacher
- Academic period
- DTR period
- Generated date/time
- Version
- File name

Example:

```text
August 1–15
Version 1
Generated August 15

August 16–31
Version 1
Generated August 31
```

---

## 14. OCR — Future Feature

OCR is not part of the MVP.

Future process:

```text
HR DTR Paper
      ↓
Teacher takes photo
      ↓
OCR
      ↓
Extract Arrival / Departure
      ↓
Teacher verifies
      ↓
Save Attendance
      ↓
DTR Generation
```

The OCR result must be editable before becoming an attendance record.

---

## 15. Dashboard

Simple teacher dashboard:

```text
Current Semester
1st Semester 2026–2027

Schedule
Configured ✓

Current DTR Period
August 16–31

Scheduled Days
12

Completed
10

Warnings
2

[ Open DTR ]
[ Edit Schedule ]
[ Generate Excel ]
```

---

## 16. MVP Feature Priority

### P0 — Required

- Teacher login
- Teacher profile
- Academic period
- Weekly schedule
- DTR calendar
- One Arrival per day
- One Departure per day
- Daily status
- Remarks
- Basic validation
- DTR preview
- Existing Excel template generation
- Download Excel

### P1 — Important

- DTR history
- Versioning
- Audit log
- Better validation
- Schedule duplication

### P2 — Future

- OCR
- Camera capture
- Supporting documents
- Admin dashboard
- Bulk teacher management
- Notifications
- PDF output
- Reports
- HR integration

---

## 17. Core User Stories

> As a teacher, I want to configure my weekly duty schedule once so that the system can automatically generate the dates I am expected to have a DTR entry.

> As a teacher, I want to enter my Arrival and Departure from the attendance details provided by HR so that I do not have to manually format the entire DTR in Excel.

> As a teacher, I want to mark a day as Online, Suspended, Holiday, or another applicable status so that the system can correctly represent that day in my DTR.

> As a teacher, I want the system to generate the existing official DTR Excel template so that I can review, download, print, and submit it without rebuilding the spreadsheet manually.

---

## 18. Core Product Principle

The system changes the workflow from:

```text
ENCODE → FORMAT → CHECK → PRINT
```

to:

```text
VERIFY → CORRECT → GENERATE → PRINT
```

The goal is to remove repetitive DTR formatting and data-transfer work while keeping the teacher responsible for the final DTR.
