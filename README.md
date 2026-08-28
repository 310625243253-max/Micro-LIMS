# MicroLIMS — Microbiology Laboratory Digital Management System

> **Production-Grade Full-Stack Digital Information System for Clinical Microbiology Laboratories**  
> *Traceability from Specimen Accessioning to Cryptographically Signed Diagnostic PDF Reports.*

---

## 🔬 System Overview

**MicroLIMS** is an enterprise laboratory management platform built with Node.js, Express, TypeScript, PostgreSQL, Redis, React, Vite, and PDFKit. It provides an end-to-end audit-logged diagnostic workflow:

```text
Sample Accessioning (SMP-26-XXXXX)
        ↓
Primary Culture Inoculation (CUL-26-XXXXX)  ← Traceable Media Lot (LOT-BA-...)
        ↓
Atmospheric Incubation Chamber (INC-26-XXXXX, Auto-Timer Daemon)
        ↓
Colonial Morphology & Phenotypic Readings (Hemolysis, CFU count)
        ↓
Biochemical Battery (Catalase, Coagulase, Oxidase, TSI...)
        ↓
AST Antibiogram Panel (Kirby-Bauer & MIC Breakpoints, S / I / R)
        ↓
Contamination Incident & Automatic Specimen Quarantine (if flagged)
        ↓
Quality Assurance Review Queue & Verification
        ↓
Electronic Sign-off (SHA-256 Digital Signature Hash)
        ↓
Official Diagnostic PDF Report (Tamper-Evident Checksum Verification)
```

---

## ⚡ Key Highlights & Architecture

- **Strict Role-Based Access Control (RBAC)**: Supports `ADMIN`, `TECHNICIAN`, `MICROBIOLOGIST`, `REVIEWER`, and `VIEWER` with granular permission checks.
- **Dual-Mode Database Layer**: Seamlessly connects to real **PostgreSQL 16** with a built-in zero-dependency high-fidelity **In-Memory fallback** (`pg-mem`) for running automated unit and integration tests instantly in any environment.
- **Resilient Redis Caching**: Aggregates laboratory cockpit KPIs with transparent fallback to database queries if Redis is offline.
- **Idempotent Background Scheduler**: Runs periodic non-overlapping incubation sweeps to automatically transition finished chamber cycles to `DUE` or `OVERDUE`.
- **Tamper-Evident Electronic Sign-off**: Generates SHA-256 cryptographic hashes for sign-offs and diagnostic reports, complete with an interactive public verification engine.
- **Rich Laboratory Design System**: Sleek modern dark mode SPA with glassmorphism panels, countdown gauges, visual lineage pipelines, and real-time event feeds.

---

## 🚀 Quick Start Guide

### Option 1: Docker Compose (Recommended)

Run the full stack (PostgreSQL, Redis, Backend API, and Frontend SPA):

```bash
docker-compose up --build
```

- **Frontend Application**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:5000/api/v1`
- **Health Check**: `http://localhost:5000/health`

---

### Option 2: Local Development

#### 1. Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations and seed realistic demo dataset
npm run migrate
npm run seed

# Start development server (Port 5000)
npm run dev

# Run automated integration test suite (27 tests across 8 suites)
npm test
```

#### 2. Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server (Port 3000)
npm run dev
```

---

## 👥 Demo Personas & Credentials

All demo accounts share the password: `Password123!`

| Role | Name | Email | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | Dr. Sarah Chen | `admin@microlims.lab` | Full access across all workspaces, users, and audit logs |
| **Lab Technician** | Alex Rivera | `tech@microlims.lab` | Specimen accessioning, media lots, culture plating, incubators |
| **Senior Microbiologist** | Dr. Marcus Vance | `micro@microlims.lab` | Colony morphology, biochemical testing battery, AST panels, QC submission |
| **QA Reviewer** | Dr. Elena Rostova | `reviewer@microlims.lab` | Quality review queue, electronic sign-off, PDF report synthesis |
| **Physician Viewer** | Dr. James Wilson | `viewer@microlims.lab` | Read-only access to final reports, specimen lineage, and public verification |

---

## 📂 Repository Structure

```text
backend/
├── src/
│   ├── app.ts                         # Express application wiring & middleware
│   ├── server.ts                      # Server lifecycle & incubation scheduler
│   ├── config/                        # Environment & configuration tokens
│   ├── db/                            # PostgreSQL connection pool, pg-mem fallback, migrations
│   │   ├── migrations/                # Schema DDL, triggers, and indices
│   │   └── seeds/                     # Synthetic realistic microbiology demo dataset
│   ├── middleware/                    # Auth JWT, RBAC permissions, audit logger, validation
│   ├── modules/                       # Domain modules (DTO, Repo, Service, Controller, Routes)
│   │   ├── auth/                      # Authentication & JWT tokens
│   │   ├── samples/                   # Specimen intake & lineage
│   │   ├── cultures/                  # Inoculated media plates
│   │   ├── media/                     # Traceable media lots
│   │   ├── incubations/               # Chamber cycles & scheduler daemon
│   │   ├── observations/              # Colonial morphology readings
│   │   ├── tests/                     # Biochemical identification tests
│   │   ├── ast/                       # Antimicrobial susceptibility testing
│   │   ├── contamination/             # Contamination incident & quarantine handler
│   │   ├── reviews/                   # Quality review & SHA-256 electronic signatures
│   │   ├── reports/                   # PDFKit diagnostic report generator & verifier
│   │   ├── dashboard/                 # Aggregated metrics & activity timeline
│   │   └── audit/                     # Immutable audit trail explorer
│   ├── types/                         # Global TypeScript interfaces
│   └── utils/                         # Identifiers, PDF styling, Redis cache wrapper
├── frontend/                          # React + TypeScript + Vite Laboratory SPA
│   ├── src/
│   │   ├── components/                # Layouts, Sidebar, Navbar, Modals, Badges, StatCards
│   │   ├── context/                   # AuthContext and role checking
│   │   ├── services/                  # Typed REST API client
│   │   ├── views/                     # Feature workspaces (Dashboard, Samples, Lineage...)
│   │   └── index.css                  # Laboratory design system & CSS tokens
├── tests/                             # Vitest integration test suites (8 files, 27 tests)
├── Dockerfile                         # Production multi-stage Docker build for backend
├── docker-compose.yml                 # Orchestration for backend, frontend, postgres, redis
└── docs/                              # Technical architecture & compliance specifications
```

---

## 🧪 Testing

MicroLIMS includes 8 comprehensive automated integration test suites:

- `tests/auth.test.ts` — Authentication, bcrypt hashing, JWT issuance, RBAC enforcement
- `tests/samples.test.ts` — Specimen CRUD, accessioning sequence (`SMP-26-XXXXX`), status state machine
- `tests/cultures_incubations.test.ts` — Inoculation, media lot linkage, chamber cycles, timer daemon
- `tests/observations_tests_ast.test.ts` — Morphology, biochemical testing battery, batch AST sensitivity
- `tests/contamination_quarantine.test.ts` — Incident logging, sample quarantine locking, approval blocks
- `tests/reviews_reports_signoff.test.ts` — Review submissions, electronic signatures, PDF generation
- `tests/dashboard_audit.test.ts` — KPI aggregator and immutable audit trail explorer
- `tests/workflow_end_to_end.test.ts` — Flagship 16-step specimen-to-verified-report lifecycle

Run all tests:
```bash
npm test
```

---

## 📄 License

Academic and Portfolio Demonstration Project. All patient and clinical records are purely synthetic.
