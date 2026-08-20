# Frontend Process Flow — Teacher DTR Automation System

## Purpose

Define the frontend workflow from teacher login through schedule setup, DTR preparation, review, Excel generation, and download.

## High-Level Flow

```text
LOGIN
  ↓
DASHBOARD
  ↓
PROFILE / ACADEMIC PERIOD / SCHEDULE
  ↓
DTR PERIOD
  ↓
DTR CALENDAR
  ↓
DAILY DTR EDITOR
  ↓
ARRIVAL + DEPARTURE
  ↓
STATUS / REMARKS
  ↓
VALIDATION
  ↓
DTR PREVIEW
  ↓
TEACHER REVIEW
  ↓
GENERATE DTR XLSX
  ↓
DOWNLOAD
  ↓
PRINT
```

---

## 1. Login

```text
/login
```

Teacher enters:

- Email / username
- Password

Flow:

```text
Enter Credentials
      ↓
POST /auth/login
      ↓
Authentication
      ↓
Success → Dashboard
Failure → Error Message
```

---

## 2. Dashboard

```text
/dashboard
```

Display:

```text
Current Academic Period
Current DTR Period
Schedule Status
DTR Completion
Warnings
Last Generated DTR
```

Actions:

```text
[ Open DTR ]
[ Schedule ]
[ Profile ]
[ DTR History ]
```

---

## 3. Teacher Profile

```text
/profile
```

Manage information required by the official DTR.

Example:

```text
Employee ID
First Name
Middle Name
Last Name
Position
Department
```

Flow:

```text
Load Profile
   ↓
Edit
   ↓
Save
   ↓
PATCH /me/profile
```

---

## 4. Academic Period

```text
/academic-period
```

Example:

```text
Academic Year: 2026–2027
Semester: 1st Semester
Start Date: August 2026
End Date: January 2027
```

The selected academic period becomes the context for:

```text
Schedule
   ↓
DTR Period
   ↓
DTR Calendar
```

---

## 5. Weekly Schedule

```text
/schedule
```

MVP fields:

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

No subject, room, section, or course is required for the MVP.

Flow:

```text
Schedule Page
      ↓
Select Day
      ↓
Set Start Time
      ↓
Set End Time
      ↓
Save
      ↓
POST /schedules
      ↓
Refresh Weekly Schedule
```

Important:

```text
Schedule
   ≠
Actual Attendance
```

---

## 6. DTR Period

```text
/dtr
```

Example:

```text
August 1–15, 2026
August 16–31, 2026
```

Flow:

```text
Select DTR Period
      ↓
Open DTR
      ↓
GET /dtr/:periodId
```

---

## 7. DTR Calendar

```text
/dtr/:periodId
```

This is the primary frontend screen.

Example:

```text
Date       Schedule       Arrival   Departure   Status
---------------------------------------------------------
Aug 17     07:00–19:00    07:03     18:58       REGULAR
Aug 18     07:00–19:00    07:01     19:02       REGULAR
Aug 19     07:00–19:00    07:30     18:55       REGULAR
Aug 20     07:00–19:00    —         —            SUSPENDED
Aug 21     07:00–19:00    07:02     19:01       REGULAR
```

Clicking a row opens:

```text
DTR Calendar
    ↓
Daily DTR Editor
```

---

## 8. Daily DTR Editor

```text
/dtr/:periodId/:date
```

### Regular Day

```text
August 17, 2026

Expected Schedule
07:00 AM - 07:00 PM

Status
[ REGULAR ▼ ]

Arrival
[ 07:03 AM ]

Departure
[ 06:58 PM ]

Remarks
[____________________]

[ CANCEL ] [ SAVE ]
```

### Suspended Day

```text
August 20, 2026

Expected Schedule
07:00 AM - 07:00 PM

Status
[ SUSPENDED ▼ ]

Reason
[ Class Suspension ]

Arrival
[ — ]

Departure
[ — ]

Remarks
[ Classes suspended due to weather ]

[ CANCEL ] [ SAVE ]
```

---

## 9. Daily Status

Supported MVP statuses:

```text
REGULAR
ONLINE
SUSPENDED
HOLIDAY
NO_CLASS
OTHER
```

Status controls what information is displayed or required.

Example:

```text
REGULAR
→ Arrival + Departure

SUSPENDED
→ Reason + Remarks

HOLIDAY
→ Remarks if needed

ONLINE
→ Status + Remarks
```

The frontend must follow backend business rules.

---

## 10. Save DTR

```text
Daily DTR Editor
      ↓
Frontend Validation
      ↓
PATCH /dtr/:periodId/:date
      ↓
Backend Validation
      ↓
Database
      ↓
Success
      ↓
Refresh DTR Calendar
```

Success:

```text
✓ DTR saved successfully.
```

Error:

```text
Unable to save DTR.
Please check the highlighted fields.
```

---

## 11. Validation

Frontend validation provides immediate feedback.

Examples:

```text
Missing Arrival
Missing Departure
Invalid Time
Arrival after Departure
```

Schedule comparison can display warnings:

```text
Expected:
07:00 AM - 07:00 PM

Actual:
07:35 AM - 06:00 PM

⚠ Late Arrival
⚠ Early Departure
```

These are warnings only. The frontend must not make payroll decisions.

---

## 12. DTR Preview

```text
/dtr/:periodId/preview
```

Example:

```text
DTR Preview

Date | Arrival | Departure | Status
------------------------------------
17   | 07:03   | 18:58     | REGULAR
18   | 07:01   | 19:02     | REGULAR
19   | 07:30   | 18:55     | REGULAR
20   |         |            | SUSPENDED
21   | 07:02   | 19:01     | REGULAR

Warnings: 1

[ BACK TO DTR ]
[ GENERATE DTR ]
```

The teacher reviews the complete DTR before generation.

---

## 13. Generate Excel

When the teacher clicks:

```text
[ GENERATE DTR ]
```

Flow:

```text
DTR Preview
     ↓
POST /dtr/:periodId/generate
     ↓
Backend Validation
     ↓
ExcelJS
     ↓
Existing DTR Template
     ↓
Generated XLSX
     ↓
Frontend receives file
```

Loading:

```text
Generating DTR...
Please wait.
```

Success:

```text
✓ DTR Generated Successfully

DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx

[ DOWNLOAD ]
```

---

## 14. Download

The frontend receives the generated XLSX and triggers the browser download.

Suggested filename:

```text
DTR_<LASTNAME>_<FIRSTNAME>_<PERIOD>.xlsx
```

Example:

```text
DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx
```

---

## 15. DTR History

Future/P1:

```text
/dtr/history
```

Example:

```text
Period             Generated        Version
------------------------------------------------
Aug 1–15, 2026     Aug 15, 2026     v1
Aug 16–31, 2026    Aug 31, 2026     v1
Sep 1–15, 2026     Sep 15, 2026     v1
```

Actions:

```text
[ VIEW ]
[ DOWNLOAD ]
```

---

# Route Map

```text
/login

/dashboard

/profile

/academic-period

/schedule

/dtr
/dtr/:periodId
/dtr/:periodId/:date
/dtr/:periodId/preview
/dtr/history
```

---

# Frontend / Backend Boundary

## Frontend

```text
UI
Navigation
Forms
Basic Validation
User Feedback
State Management
File Download
```

## Backend

```text
Authentication
Authorization
Business Rules
Database
Final Validation
DTR Processing
Excel Generation
Audit
```

The backend remains the source of truth for business rules.

---

# Recommended FE Architecture

```text
src/
├── app/
│   ├── router/
│   └── providers/
│
├── layouts/
│   ├── AuthLayout/
│   └── AppLayout/
│
├── pages/
│   ├── Login/
│   ├── Dashboard/
│   ├── Profile/
│   ├── AcademicPeriod/
│   ├── Schedule/
│   └── DTR/
│       ├── DTRList/
│       ├── DTRCalendar/
│       ├── DTRDay/
│       └── DTRPreview/
│
├── features/
│   ├── auth/
│   ├── profile/
│   ├── academic-period/
│   ├── schedule/
│   ├── dtr/
│   └── excel/
│
├── components/
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   ├── Table/
│   ├── TimeInput/
│   └── StatusBadge/
│
├── services/
│   ├── auth.service.ts
│   ├── profile.service.ts
│   ├── schedule.service.ts
│   └── dtr.service.ts
│
├── hooks/
├── schemas/
├── types/
└── utils/
```

---

# FE Data Flow

```text
Backend API
     ▲
     │
React Query
     ▲
     │
Feature Hooks
     ▲
     │
Page Components
     ▲
     │
UI Components
```

Example:

```text
DTR Calendar
     ↓
useDTRPeriod()
     ↓
GET /dtr/:periodId
     ↓
Backend
     ↓
DTR Data
     ↓
React Query Cache
     ↓
Calendar UI
```

---

# Frontend States

Every API-driven page should support:

```text
LOADING
EMPTY
SUCCESS
ERROR
RETRY
```

Example:

```text
Loading:
Loading DTR...

Empty:
No DTR period found.

Error:
Unable to load DTR.

Success:
DTR loaded successfully.
```

---

# Frontend Security

- [ ] Protected routes
- [ ] Authentication state
- [ ] Session expiration handling
- [ ] Do not expose secrets
- [ ] Do not trust frontend authorization
- [ ] Backend validates ownership
- [ ] Do not expose sensitive backend errors
- [ ] Validate future file uploads

---

# MVP Frontend Screens

```text
1. Login
2. Dashboard
3. Teacher Profile
4. Academic Period
5. Weekly Schedule
6. DTR Period
7. DTR Calendar
8. Daily DTR Editor
9. DTR Preview
10. Generate / Download
```

---

# FE Priority

## P0

```text
Login
Dashboard
Profile
Academic Period
Schedule
DTR Calendar
Daily DTR Editor
Daily Status
Validation
DTR Preview
Excel Download
```

## P1

```text
DTR History
Generation History
Improved Dashboard
Improved UX
```

## P2

```text
OCR Upload
Camera Capture
Admin Dashboard
Notifications
Reports
```

---

# Complete Frontend User Journey

```text
┌─────────────┐
│    LOGIN    │
└──────┬──────┘
       ↓
┌─────────────┐
│  DASHBOARD  │
└──────┬──────┘
       ↓
┌─────────────────┐
│ SELECT SEMESTER │
└──────┬──────────┘
       ↓
┌─────────────────┐
│ WEEKLY SCHEDULE │
└──────┬──────────┘
       ↓
┌─────────────────┐
│   DTR PERIOD    │
└──────┬──────────┘
       ↓
┌─────────────────┐
│   DTR CALENDAR  │
└──────┬──────────┘
       ↓
┌─────────────────┐
│  SELECT DATE    │
└──────┬──────────┘
       ↓
┌─────────────────┐
│ DAILY DTR EDITOR│
└──────┬──────────┘
       ↓
┌─────────────────┐
│     SAVE        │
└──────┬──────────┘
       ↓
┌─────────────────┐
│    VALIDATE     │
└──────┬──────────┘
       ↓
   ┌───┴────┐
   │        │
 ERROR     VALID
   │        │
   ↓        ↓
CORRECT  PREVIEW
            ↓
         REVIEW
            ↓
     GENERATE EXCEL
            ↓
         DOWNLOAD
            ↓
           PRINT
```

---

# Frontend Definition of Done

- [ ] Login works
- [ ] Protected routes work
- [ ] Dashboard works
- [ ] Profile can be viewed/updated
- [ ] Academic period can be selected
- [ ] Weekly schedule can be created
- [ ] Weekly schedule can be edited
- [ ] Weekly schedule can be deleted
- [ ] DTR period can be selected
- [ ] DTR calendar displays scheduled dates
- [ ] Teacher can open a DTR date
- [ ] Teacher can enter Arrival
- [ ] Teacher can enter Departure
- [ ] Teacher can select status
- [ ] Teacher can add remarks
- [ ] Validation feedback works
- [ ] DTR preview works
- [ ] Excel generation can be triggered
- [ ] XLSX can be downloaded
- [ ] Loading states work
- [ ] Empty states work
- [ ] Error states work
- [ ] Session expiration works
- [ ] Protected data cannot be accessed through the UI by unauthorized users

---

# Final FE Principle

The frontend should make the teacher's workflow:

```text
CONFIGURE ONCE
      ↓
RECEIVE HR RECORD
      ↓
VERIFY
      ↓
CORRECT IF NEEDED
      ↓
REVIEW
      ↓
GENERATE
      ↓
PRINT
```

instead of:

```text
OPEN EXCEL
      ↓
FIND DATE
      ↓
TYPE DATA
      ↓
FORMAT
      ↓
CHECK
      ↓
REPEAT
      ↓
PRINT
```

The frontend's primary value is **workflow simplification** while keeping the teacher responsible for verifying the final DTR.
