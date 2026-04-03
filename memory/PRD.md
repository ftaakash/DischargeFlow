# DischargeFlow - Product Requirements Document

## Project Overview
DischargeFlow is a Hospital Discharge Management System MVP designed to streamline patient discharge workflows, reduce discharge time from 6-8 hours to under 2 hours, and improve coordination between healthcare staff.

## Original Problem Statement
Build a production-ready Hospital Discharge Management System based on the DischargeFlow specification document with:
- MVP + AI scope
- Google social login with role-based access
- In-app notifications
- Dark theme

## User Personas

### Physician
- Initiates discharge workflows
- Generates and approves AI discharge summaries
- Completes final discharge approval
- Views patient records and analytics

### Nurse
- Manages discharge tasks (education, vitals, equipment)
- Updates patient information
- Coordinates with other departments
- Receives notifications for new discharges

### Pharmacist
- Handles medication review and preparation tasks
- Manages prescription-related workflows
- Receives notifications for medication tasks

### Admin
- Manages user roles and permissions
- Views system-wide analytics
- Has access to all system features

## Core Requirements (Static)

### Authentication
- Google OAuth via Emergent Auth
- Session-based authentication with 7-day expiry
- Role-based access control (Physician, Nurse, Pharmacist, Admin)

### Patient Management
- CRUD operations for patients
- Patient status tracking (Admitted, Pending Discharge, Discharged)
- Patient search and filtering

### Discharge Workflow
- Workflow initiation by physicians
- Task orchestration with 8 standard discharge tasks
- Progress tracking with completion percentage
- Estimated discharge time calculation

### AI-Powered Discharge Summaries
- Integration with Gemini 3 Flash (via Emergent LLM key)
- Physician approval workflow for AI-generated content
- Professional medical documentation format

### Task Management
- Role-based task assignment
- Priority levels (High, Medium, Low)
- Task completion tracking
- Automatic workflow status updates

### In-App Notifications
- Role-based notification routing
- Real-time notification feed
- Mark as read functionality

### Analytics Dashboard
- Patient statistics
- Workflow metrics
- Task distribution by role
- Average discharge time tracking

## What's Been Implemented (Jan 2026)

### Backend (FastAPI)
- ✅ Authentication system with Google OAuth
- ✅ User management with RBAC
- ✅ Patient CRUD operations
- ✅ Discharge workflow initiation and tracking
- ✅ Task management with role-based filtering
- ✅ AI summary generation with Gemini 3 Flash
- ✅ Notification system
- ✅ Analytics endpoints
- ✅ Data seeding for demo

### Frontend (React)
- ✅ Dark theme UI with clinical design
- ✅ Login page with Google OAuth
- ✅ Patient list with search and filters
- ✅ Patient details view
- ✅ Discharge workflow view with task checklist
- ✅ AI summary generation and approval
- ✅ Tasks view (My Tasks / All Tasks)
- ✅ Analytics dashboard with charts
- ✅ Admin panel for user management
- ✅ Notification center
- ✅ Responsive sidebar navigation

### Database (MongoDB)
- ✅ Users collection
- ✅ User sessions collection
- ✅ Patients collection
- ✅ Workflows collection
- ✅ Tasks collection
- ✅ Discharge summaries collection
- ✅ Notifications collection

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Radix UI
- **Backend:** FastAPI, Python 3.x
- **Database:** MongoDB
- **AI:** Gemini 3 Flash via Emergent LLM Key
- **Auth:** Emergent Google OAuth

## Prioritized Backlog

### P0 (Critical) - Done
- [x] User authentication
- [x] Patient management
- [x] Discharge workflow
- [x] Task management
- [x] AI discharge summaries

### P1 (High Priority) - Future
- [ ] Email/SMS notifications (currently in-app only)
- [ ] Medication management integration
- [ ] Billing system integration
- [ ] Follow-up appointment scheduling

### P2 (Medium Priority) - Future
- [ ] Patient education materials library
- [ ] Print discharge documents
- [ ] Workflow templates customization
- [ ] Advanced analytics and reporting
- [ ] Audit logging for HIPAA compliance

### P3 (Low Priority) - Future
- [ ] EHR/EMR integration
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Custom branding

## Next Tasks
1. Add email notifications using SendGrid/Resend
2. Implement medication management module
3. Add discharge document printing
4. Create workflow templates editor
5. Implement audit logging

## API Endpoints Summary

### Authentication
- `POST /api/auth/session` - Exchange session_id for token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Patients
- `GET /api/patients` - List patients
- `GET /api/patients/{id}` - Get patient
- `POST /api/patients` - Create patient
- `PUT /api/patients/{id}` - Update patient

### Workflows
- `POST /api/workflows/initiate/{patient_id}` - Start discharge
- `GET /api/workflows` - List workflows
- `GET /api/workflows/{id}` - Get workflow with tasks
- `PUT /api/workflows/{id}/complete` - Complete discharge

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/my` - Get my tasks
- `PUT /api/tasks/{id}` - Update task

### AI
- `POST /api/ai/generate-summary` - Generate AI summary
- `PUT /api/ai/approve-summary/{id}` - Approve summary

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/tasks-by-role` - Task distribution
