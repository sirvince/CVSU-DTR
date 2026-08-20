# Teacher DTR Automation System
## Business Analysis & Project Management Baseline

**Document Type:** Business Requirements / Project Baseline  
**Project:** Teacher DTR Automation System  
**Version:** 1.0  
**Status:** Draft / MVP Planning  
**Primary Users:** Teachers / Faculty  
**Current Process Owner:** HR  
**System Boundary:** Teacher-side DTR preparation

---

# 1. Executive Summary

The Teacher DTR Automation System is a teacher-side application intended to reduce the repetitive manual work involved in preparing the Daily Time Record (DTR).

The current process requires HR to obtain attendance records, distribute the records to teachers, and teachers to manually transfer the attendance information into the official DTR Excel format.

The proposed system does **not** replace HR's existing attendance process.

Instead, it provides a controlled workflow where teachers:

1. Configure their weekly duty schedule.
2. Receive the attendance details from HR through the existing process.
3. Enter or verify their Arrival and Departure.
4. Record special situations such as Online Class, Suspension, Holiday, or No Class.
5. Review the generated DTR.
6. Automatically generate the existing official DTR Excel template.
7. Download and print the completed DTR.

The main business principle is:

> **The teacher should verify the DTR, not repeatedly rebuild and format the DTR manually.**

---

# 2. Business Problem

## 2.1 Current Situation

The current DTR preparation process is:

```text
Biometric / Time-in Device
        ↓
HR exports attendance
        ↓
HR distributes attendance / DTR details
        ↓
Teacher receives record
        ↓
Teacher manually encodes Excel
        ↓
Teacher manually checks and formats DTR
        ↓
Teacher prints DTR
```

## 2.2 Problems

The current process creates several operational issues:

- Repetitive manual encoding
- Re-entry of information already available from HR
- Manual Excel formatting
- Higher possibility of encoding errors
- Additional workload for teachers
- DTR preparation delays
- Repeated setup for every DTR period
- Additional manual work when schedules change
- Additional handling for online classes, suspensions, holidays, and no-class dates

## 2.3 Root Cause

The main issue is not the availability of attendance data.

The issue is the **manual transformation of HR-provided attendance information into the required DTR format**.

```text
Existing Attendance Data
        ↓
Manual Interpretation
        ↓
Manual Encoding
        ↓
Manual Formatting
        ↓
DTR
```

---

# 3. Business Objective

The primary objective is:

> **To reduce manual DTR preparation work by providing teachers with a system that uses their configured schedule and verified attendance information to automatically prepare the existing DTR Excel format.**

---

# 4. Business Goals

## Goal 1 — Reduce Manual Encoding

Minimize repetitive transfer of attendance information from HR-provided records into Excel.

## Goal 2 — Reduce DTR Preparation Time

Reduce the amount of time teachers spend preparing and formatting DTRs.

## Goal 3 — Reduce Encoding Errors

Provide validation and structured data entry before generating the final DTR.

## Goal 4 — Maintain HR Workflow

Do not require HR to change its existing attendance extraction and distribution process.

## Goal 5 — Standardize DTR Preparation

Ensure generated DTRs consistently follow the existing official Excel template.

## Goal 6 — Handle Schedule Exceptions

Allow teachers to properly record dates affected by:

- Online classes
- Class suspensions
- Holidays
- No class
- Other approved situations

---

# 5. Success Measures

The MVP should aim for:

| Measure | Current State | Target State |
|---|---|---|
| Manual Excel formatting | Required | Minimized / eliminated |
| Repeated schedule setup | Repeated | Once per academic period |
| Attendance re-entry | Manual | Structured verification |
| DTR validation | Manual | System-assisted |
| HR workflow changes | N/A | 0 |
| Official DTR format | Manual | Existing template automatically populated |
| Teacher accountability | Manual | Maintained |

The most important success measure is:

> **Reduction in teacher DTR preparation effort without changing the official HR attendance process.**

---

# 6. Stakeholders

## Primary Stakeholders

### Teachers

Responsibilities:

- Configure schedule
- Enter/verify attendance
- Record exceptions
- Review DTR
- Generate final DTR
- Print/submit DTR

### HR

Responsibilities remain unchanged:

- Obtain attendance records
- Export attendance data
- Prepare/distribute attendance details

The MVP should not require HR to use the system.

## Future Stakeholders

### Administrator

Potential responsibilities:

- Manage teachers
- Manage academic periods
- Configure DTR settings
- Manage templates
- Review audit logs

### School Management

Potential future use:

- Reporting
- Monitoring
- Process improvement
- Institutional deployment

---

# 7. Current Process

```text
                  HR
                   │
                   ▼
        Biometric / Time Device
                   │
                   ▼
            HR Attendance
                   │
                   ▼
          HR Distribution
                   │
                   ▼
              Teacher
                   │
                   ▼
          Manual Excel Entry
                   │
                   ▼
          Manual DTR Checking
                   │
                   ▼
                Print
```

---

# 8. Proposed Process

```text
                  HR
                   │
                   ▼
            HR Attendance
                   │
                   ▼
          HR Distribution
                   │
                   ▼
              Teacher
                   │
                   ▼
          Teacher DTR System
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 Teacher Schedule       Attendance Details
        │                     │
        └──────────┬──────────┘
                   ▼
             DTR Calendar
                   │
                   ▼
       Arrival + Departure
                   │
                   ▼
       Daily Status / Remarks
                   │
                   ▼
             Validation
                   │
                   ▼
          Teacher Review
                   │
                   ▼
             DTR Preview
                   │
                   ▼
        Existing DTR Template
                   │
                   ▼
              Download
                   │
                   ▼
                 Print
```

---

# 9. Key Business Principle

The system must separate:

```text
Expected Schedule
        ≠
Actual Attendance
```

## Schedule

Example:

```text
Monday
07:00 AM - 07:00 PM
```

This represents the teacher's expected duty schedule.

## Actual Attendance

Example:

```text
Arrival:   07:03 AM
Departure: 06:58 PM
```

This represents the attendance information provided by HR.

The schedule must never automatically become actual attendance.

---

# 10. Schedule Requirements

The MVP intentionally uses a simple schedule model.

A schedule contains:

```text
Teacher
Academic Period
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

This keeps the first version focused on DTR preparation.

---

# 11. Attendance Requirements

The actual DTR attendance model uses:

```text
Arrival
Departure
```

There is no need for:

```text
AM IN
AM OUT
PM IN
PM OUT
```

Example:

```text
Date       Arrival   Departure
--------------------------------
Aug 17     07:03     18:58
Aug 18     07:01     19:02
Aug 19     07:30     18:55
```

---

# 12. Daily Status / Exception Requirements

A scheduled day may have a different actual situation.

Supported MVP statuses:

```text
REGULAR
ONLINE
SUSPENDED
HOLIDAY
NO_CLASS
OTHER
```

## Regular

```text
Status: REGULAR
Arrival: 07:03
Departure: 18:58
```

## Online

```text
Status: ONLINE
Arrival: —
Departure: —
Remarks: Classes conducted online
```

## Suspended

```text
Status: SUSPENDED
Arrival: —
Departure: —
Reason: Class Suspension
Remarks: Classes suspended due to weather
```

## Holiday

```text
Status: HOLIDAY
```

## No Class

```text
Status: NO_CLASS
```

The system must not automatically determine payroll eligibility from these statuses unless an official policy is explicitly configured.

---

# 13. Functional Requirements

## FR-001 — Authentication

The system shall allow teachers to securely authenticate.

## FR-002 — Teacher Profile

The system shall store teacher information required by the DTR template.

## FR-003 — Academic Period

The system shall allow the teacher to select an academic year and semester.

## FR-004 — Weekly Schedule

The system shall allow teachers to configure their expected weekly schedule.

## FR-005 — DTR Calendar

The system shall automatically generate scheduled dates based on the teacher's weekly schedule.

## FR-006 — Attendance

The system shall allow teachers to record one Arrival and one Departure per day.

## FR-007 — Daily Status

The system shall allow teachers to assign a status to a DTR date.

## FR-008 — Remarks

The system shall allow teachers to add remarks for applicable exceptions.

## FR-009 — Validation

The system shall identify missing, invalid, or inconsistent attendance information.

## FR-010 — DTR Preview

The system shall provide a preview before Excel generation.

## FR-011 — Excel Generation

The system shall populate the existing official DTR Excel template.

## FR-012 — Download

The system shall allow teachers to download the generated DTR.

---

# 14. Non-Functional Requirements

## NFR-001 — Security

Teachers shall only access their own records.

## NFR-002 — Reliability

Generated Excel files must open successfully in Microsoft Excel.

## NFR-003 — Usability

The teacher should be able to prepare a normal DTR with minimal navigation.

## NFR-004 — Maintainability

Business logic should be separated from Excel generation.

## NFR-005 — Compatibility

The generated workbook must preserve the official DTR format.

## NFR-006 — Timezone

School-facing dates and times shall use:

```text
Asia/Manila
```

## NFR-007 — Performance

Normal DTR generation should complete within a few seconds for a standard DTR period.

---

# 15. Business Rules

### BR-001

A teacher schedule belongs to an academic period.

### BR-002

A schedule contains one day and one expected time range.

### BR-003

Actual attendance comes from the HR-provided attendance details.

### BR-004

The schedule must not automatically become attendance.

### BR-005

A DTR day may have one Arrival and one Departure.

### BR-006

Special statuses may have no Arrival/Departure.

### BR-007

Special status treatment must follow official school rules.

### BR-008

The system must not independently determine payroll eligibility.

### BR-009

The original DTR Excel master template must not be modified.

### BR-010

Only the teacher owning the record may modify it.

---

# 16. MVP Scope

## P0 — Must Have

```text
Authentication
Teacher Profile
Academic Period
Weekly Schedule
DTR Calendar
Arrival / Departure
Daily Status
Remarks
Validation
DTR Preview
Excel Generator
Download
```

## P1 — Should Have

```text
DTR History
Generation Version
Audit Log
Dashboard
Improved Validation
```

## P2 — Could Have

```text
OCR
Camera Capture
Supporting Documents
Admin Dashboard
Notifications
PDF
Reports
```

## P3 — Future

```text
HR Integration
Biometric Integration
Payroll Integration
Institution-wide Integration
```

---

# 17. Out of Scope for MVP

The MVP will not:

- Connect directly to biometric devices
- Connect directly to HR databases
- Replace HR's existing attendance system
- Modify HR's official attendance records
- Automatically declare class suspensions
- Automatically determine payroll eligibility
- Automatically determine whether a suspension is payable
- Require HR accounts
- Require HR to change its workflow

---

# 18. Product Workflow

```text
1. Teacher Login
        ↓
2. Teacher Profile
        ↓
3. Select Academic Period
        ↓
4. Configure Weekly Schedule
        ↓
5. Select DTR Period
        ↓
6. System Generates DTR Calendar
        ↓
7. Receive HR Attendance Details
        ↓
8. Enter Arrival / Departure
        ↓
9. Mark Daily Status / Exception
        ↓
10. Validate
        ↓
11. Review DTR
        ↓
12. Generate Excel
        ↓
13. Download
        ↓
14. Print
```

---

# 19. Requirements Traceability

Business requirements should map to implementation tickets.

| Business Requirement | Ticket |
|---|---|
| Teacher authentication | DTR-002 |
| Teacher profile | DTR-003 |
| Academic period | DTR-004 |
| Weekly schedule | DTR-005 |
| DTR period | DTR-006 |
| DTR calendar | DTR-007 |
| Attendance entry | DTR-008 |
| Daily status | DTR-009 |
| Validation | DTR-010 |
| DTR preview | DTR-011 |
| Excel generator | DTR-012 |
| Download | DTR-013 |
| History | DTR-014 |
| Audit log | DTR-015 |
| Dashboard | DTR-016 |
| OCR | DTR-017 |
| Admin | DTR-018 |
| Testing | DTR-019 |
| Deployment | DTR-020 |

This provides traceability:

```text
Business Requirement
        ↓
Feature
        ↓
Ticket
        ↓
Acceptance Criteria
        ↓
Test Case
        ↓
Release
```

---

# 20. Project Risks

## Risk 1 — DTR Template Changes

**Impact:** High

The official DTR template may change.

**Mitigation:**

- Keep template separate from application code.
- Use template versioning.
- Maintain a cell mapping document.

---

## Risk 2 — Incorrect Interpretation of DTR Rules

**Impact:** High

Incorrect assumptions about online classes, suspensions, holidays, or payment treatment could produce incorrect records.

**Mitigation:**

- Do not hardcode payroll decisions.
- Confirm official rules.
- Treat the system as a preparation/verification tool.

---

## Risk 3 — Teacher Adoption

**Impact:** Medium

Teachers may prefer the existing Excel workflow.

**Mitigation:**

- Keep UI simple.
- Minimize data entry.
- Demonstrate time saved.
- Preserve the familiar official Excel output.

---

## Risk 4 — HR Resistance

**Impact:** High

HR may not want integration or changes to its process.

**Mitigation:**

- Do not require HR integration for MVP.
- Position the system as teacher-side assistance.
- Keep HR's current process unchanged.

---

## Risk 5 — OCR Accuracy

**Impact:** Medium

OCR may incorrectly read printed or photographed attendance records.

**Mitigation:**

- Keep OCR out of MVP.
- Require teacher verification before saving OCR results.

---

# 21. Assumptions

- HR continues providing attendance details.
- The existing DTR Excel template remains the official output.
- Teachers are responsible for verifying their DTR.
- One Arrival and one Departure are sufficient for the current DTR workflow.
- Weekly schedule is sufficient for generating expected DTR dates.
- Official school rules determine treatment of special statuses.
- The MVP does not require HR system access.

---

# 22. Constraints

- HR process must remain unchanged.
- Official DTR format must be preserved.
- Project should be simple enough for rapid MVP development.
- MVP should avoid unnecessary integrations.
- System must maintain teacher data isolation.
- Date/time must follow Philippine local time.

---

# 23. MVP Release Criteria

The MVP can be considered complete when a teacher can successfully perform this entire flow:

```text
LOGIN
  ↓
PROFILE
  ↓
ACADEMIC PERIOD
  ↓
SCHEDULE
  ↓
DTR PERIOD
  ↓
DTR CALENDAR
  ↓
ARRIVAL + DEPARTURE
  ↓
STATUS / REMARKS
  ↓
VALIDATION
  ↓
PREVIEW
  ↓
GENERATE EXCEL
  ↓
DOWNLOAD
  ↓
PRINT
```

The generated Excel must:

- Use the existing DTR template.
- Contain the correct teacher information.
- Contain the correct DTR period.
- Contain the correct dates.
- Contain Arrival values.
- Contain Departure values.
- Preserve the official formatting.
- Open successfully.

---

# 24. 1-Day MVP Strategy

If the objective is to demonstrate a working prototype in one day, the implementation priority should be:

## Morning

```text
Project Setup
    ↓
Database
    ↓
Authentication
    ↓
Teacher Profile
    ↓
Academic Period
    ↓
Weekly Schedule
```

## Afternoon

```text
DTR Period
    ↓
DTR Calendar
    ↓
Arrival / Departure
    ↓
Daily Status
    ↓
Basic Validation
    ↓
DTR Preview
```

## Final Development Block

```text
ExcelJS
    ↓
Map Existing DTR Template
    ↓
Populate Data
    ↓
Generate XLSX
    ↓
Download
    ↓
End-to-End Test
```

Do not include OCR, HR integration, payroll, notifications, or a complex admin module in the one-day MVP.

---

# 25. Definition of Done — Project MVP

The MVP is DONE when:

- [ ] Teacher can log in.
- [ ] Teacher can maintain profile.
- [ ] Teacher can select academic period.
- [ ] Teacher can configure weekly schedule.
- [ ] System generates DTR dates automatically.
- [ ] Teacher can enter Arrival.
- [ ] Teacher can enter Departure.
- [ ] Teacher can mark Online.
- [ ] Teacher can mark Suspended.
- [ ] Teacher can mark Holiday.
- [ ] Teacher can mark No Class.
- [ ] Teacher can add remarks.
- [ ] System validates DTR data.
- [ ] Teacher can review DTR.
- [ ] System generates the existing DTR Excel template.
- [ ] Excel file opens successfully.
- [ ] Teacher can download the file.
- [ ] Teacher can print the file.
- [ ] No HR workflow changes are required.

---

# 26. Recommended Project Management Approach

The project should use small, independently testable tickets.

Each ticket should contain:

```text
Ticket ID
    ↓
Description
    ↓
Objective
    ↓
Goal
    ↓
Business Rules
    ↓
Scope
    ↓
Functional Requirements
    ↓
Technical Requirements
    ↓
Acceptance Criteria
    ↓
Implementation Tasks
    ↓
Testing
    ↓
Definition of Done
```

This prevents development from becoming feature-driven without a clear business outcome.

---

# 27. Recommended First Tickets

Start implementation with:

```text
DTR-001  Project Setup
DTR-002  Authentication
DTR-003  Teacher Profile
DTR-004  Academic Period
DTR-005  Teacher Weekly Schedule
DTR-006  DTR Period
DTR-007  DTR Calendar Generation
DTR-008  Daily Attendance Entry
DTR-009  Daily Status / Exceptions
DTR-010  DTR Validation
DTR-011  DTR Preview
DTR-012  Excel DTR Generator
DTR-013  Excel Download
```

After these are complete, the MVP can already demonstrate the complete business value.

---

# 28. Final Business Statement

## Problem

Teachers spend unnecessary time manually transferring and formatting attendance information into the official DTR Excel format.

## Solution

Provide a teacher-side system that uses the teacher's weekly schedule and HR-provided attendance details to prepare, validate, and automatically generate the existing DTR Excel template.

## Business Value

```text
Less Manual Work
       ↓
Less Repetitive Encoding
       ↓
Fewer Formatting Errors
       ↓
Faster DTR Preparation
       ↓
Consistent DTR Output
```

## Key Principle

> **Automate the preparation, not the authority.**

HR remains the source of attendance information.

The teacher remains responsible for verifying the DTR.

The system automates the repetitive preparation and formatting work.
