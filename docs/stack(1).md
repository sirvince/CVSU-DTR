# Teacher DTR Automation System — Technology Stack

## 1. Stack Overview

The system is intentionally simple for the MVP.

```text
Frontend
React + Vite + TypeScript
        ↓
Backend API
NestJS + TypeScript
        ↓
Database
MySQL / MariaDB
        ↓
DTR Processing
        ↓
ExcelJS
        ↓
Existing DTR Excel Template
```

The architecture should support future OCR without making OCR a dependency of the MVP.

---

## 2. Frontend

Recommended:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- Axios

### Main Screens

```text
/login

/dashboard

/profile

/academic-period

/schedule

/dtr

/dtr/:period

/dtr/:period/:date
```

### Main Responsibilities

- Teacher login
- Teacher profile
- Academic period
- Weekly schedule
- DTR calendar
- Daily DTR editor
- Arrival/Departure entry
- Status and remarks
- Validation warnings
- DTR preview
- Excel generation/download

---

## 3. Backend

Recommended:

- Node.js
- NestJS
- TypeScript
- TypeORM
- class-validator
- class-transformer

### Suggested Modules

```text
src/
├── auth/
├── users/
├── teachers/
├── academic-periods/
├── schedules/
├── dtr/
│   ├── periods/
│   ├── calendar/
│   ├── days/
│   ├── validation/
│   └── generator/
├── templates/
├── audit/
└── common/
```

---

## 4. Database

Recommended:

- MySQL
- MariaDB

The MVP only needs a small relational model.

### Core Tables

```text
users
teacher_profiles
academic_periods
teacher_schedules
dtr_periods
dtr_days
dtr_generations
audit_logs
```

There is no need for a complex subject/class table in the MVP.

---

## 5. Teacher Schedule Model

A schedule record only needs:

```text
teacher_schedule
----------------
id
teacher_id
academic_period_id
day_of_week
start_time
end_time
```

Example:

```text
teacher_id: 123
academic_period_id: 1
day_of_week: MONDAY
start_time: 07:00
end_time: 19:00
```

The schedule is used to generate expected DTR dates.

It should not be copied directly into actual attendance.

---

## 6. DTR Day Model

A DTR day can contain:

```text
dtr_day
----------------
id
dtr_period_id
date
schedule_start_time
schedule_end_time
arrival_time
departure_time
status
reason
remarks
```

Suggested status values:

```text
REGULAR
ONLINE
SUSPENDED
HOLIDAY
NO_CLASS
OTHER
```

This keeps the MVP simple.

---

## 7. Date and Time

Use:

```text
Asia/Manila
```

for school-facing dates and times.

### Important

DTR attendance is a local school-time concept.

Example:

```text
DTR Date: 2026-08-17
Arrival: 07:03
Departure: 18:58
```

Do not allow UTC conversion to change the calendar date or displayed DTR time.

For timestamps such as `createdAt` and `updatedAt`, use explicit timezone-aware handling.

---

## 8. Excel Generation

Recommended:

```text
ExcelJS
```

### Strategy

Use the existing DTR workbook as the master template.

```text
Master DTR Template
        ↓
Load Workbook
        ↓
Populate Teacher Information
        ↓
Populate DTR Dates
        ↓
Populate Arrival
        ↓
Populate Departure
        ↓
Populate applicable fields
        ↓
Preserve formatting
        ↓
Save generated workbook
```

Do not rebuild the DTR layout from scratch.

---

## 9. Excel Template Management

Recommended:

```text
storage/
└── templates/
    └── dtr/
        └── DTR-FORMAT-MASTER.xlsx
```

The master file should be read-only from the application's normal workflow.

Every generation creates a new output file.

Example:

```text
DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx
```

---

## 10. API Design

Simple REST API.

Example:

```text
POST   /auth/login

GET    /me
GET    /me/profile

GET    /academic-periods
POST   /academic-periods

GET    /schedules
POST   /schedules
PATCH  /schedules/:id
DELETE /schedules/:id

GET    /dtr/periods
POST   /dtr/periods

GET    /dtr/calendar
GET    /dtr/days/:date
PATCH  /dtr/days/:date

POST   /dtr/validate
POST   /dtr/generate

GET    /dtr/generations
```

---

## 11. Validation

Frontend validation:

- Required fields
- Time format
- Valid status

Backend validation:

- Date belongs to DTR period
- Teacher owns the record
- Valid time values
- Valid status
- Schedule lookup
- Duplicate protection

Example warning:

```text
Schedule:
07:00–19:00

Actual:
07:35–18:00

Warnings:
Late Arrival
Early Departure
```

Warnings should not automatically determine payroll treatment.

---

## 12. Authentication and Security

MVP:

- JWT authentication
- Password hashing with Argon2 or bcrypt
- Role-based authorization
- DTO validation
- Rate limiting for login
- Secure HTTP headers
- CORS
- Environment-based secrets

A teacher should only be able to access their own:

- Profile
- Schedule
- DTR
- Generated files

---

## 13. Deployment

Simple Docker deployment:

```text
Docker Compose
├── frontend
├── backend
└── mysql
```

Production:

```text
Internet
   ↓
Nginx
   ↓
Frontend / Backend
   ↓
MySQL
```

Recommended:

- Docker
- Docker Compose
- Nginx
- HTTPS
- Environment variables
- Database backup

---

## 14. Environment Variables

```text
NODE_ENV=production

APP_PORT=3000

DATABASE_HOST=
DATABASE_PORT=3306
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=

JWT_SECRET=
JWT_REFRESH_SECRET=

APP_TIMEZONE=Asia/Manila

DTR_TEMPLATE_PATH=
STORAGE_PATH=
```

Never commit secrets to Git.

---

## 15. OCR — Future

OCR should be a separate service/module later.

```text
DTR Paper
   ↓
Image Upload
   ↓
OCR
   ↓
Extract Arrival / Departure
   ↓
Teacher Verification
   ↓
DTR Day
```

Possible future services:

- Google Cloud Vision
- AWS Textract
- Azure AI Vision
- Tesseract

The choice should depend on cost, accuracy, privacy, and document quality.

---

## 16. Testing

### Backend

- Unit tests
- Service tests
- API tests
- Validation tests
- Excel generation tests

### Important Cases

```text
Normal scheduled day
Late arrival
Early departure
Missing arrival
Missing departure
Online day
Suspended day
Holiday
No class
Weekend
Schedule changes
Month boundary
Semester boundary
Excel generation
```

### Excel Tests

Verify:

- Correct teacher name
- Correct DTR period
- Correct date
- Correct Arrival
- Correct Departure
- Correct template
- Formatting preserved
- Workbook opens successfully

---

## 17. Recommended Repository

Simple monorepo:

```text
teacher-dtr/
├── apps/
│   ├── web/
│   └── api/
├── storage/
│   └── templates/
├── docs/
├── docker-compose.yml
├── .env.example
├── README.md
└── package.json
```

For the one-day MVP, a simpler structure is also acceptable.

---

## 18. MVP Dependencies

### Frontend

```text
react
react-dom
react-router-dom
@tanstack/react-query
react-hook-form
zod
tailwindcss
axios
```

### Backend

```text
@nestjs/common
@nestjs/core
@nestjs/config
@nestjs/jwt
typeorm
mysql2
class-validator
class-transformer
exceljs
argon2
```

Avoid adding libraries unless an actual feature needs them.

---

## 19. Architecture Principle

Keep DTR business logic independent from Excel generation.

```text
Schedule
   +
DTR Day
   +
Attendance
   +
Daily Status
   ↓
DTR Domain Logic
   ↓
Verified DTR
   ↓
Excel Generator
   ↓
Official DTR XLSX
```

This allows future output formats such as PDF without changing the core DTR logic.

---

## 20. MVP Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| UI | Tailwind CSS |
| API State | TanStack Query |
| Forms | React Hook Form + Zod |
| Backend | NestJS + TypeScript |
| ORM | TypeORM |
| Database | MySQL / MariaDB |
| Authentication | JWT + Argon2 |
| Excel | ExcelJS |
| Runtime | Node.js |
| Containerization | Docker |
| Reverse Proxy | Nginx |
| Timezone | Asia/Manila |

## 21. Development Priority

```text
1. Authentication
2. Teacher Profile
3. Academic Period
4. Weekly Schedule
5. DTR Calendar
6. Arrival / Departure Entry
7. Daily Status
8. Validation
9. DTR Preview
10. Excel Generator
11. History
12. OCR
```

The first 10 items are enough for the functional MVP.
