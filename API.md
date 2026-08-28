# MicroLIMS REST API Reference (v1)

Base URL: `/api/v1`

---

## 🔐 Authentication & Session

- `POST /api/v1/auth/login` — Authenticate operator and receive JWT accessToken & refreshToken.
- `GET /api/v1/auth/me` — Retrieve current user profile and role array.
- `POST /api/v1/auth/refresh` — Issue fresh access token using valid refresh token.
- `POST /api/v1/auth/logout` — Invalidate user session.

---

## 🧪 Specimens & Accessioning

- `GET /api/v1/samples` — List specimens (supports `search`, `status`, `priority`, `sampleType`, pagination).
- `POST /api/v1/samples` — Accession new clinical specimen (`SMP-26-XXXXX`).
- `GET /api/v1/samples/:id` — Retrieve specimen details by UUID.
- `GET /api/v1/samples/:id/lineage` — Retrieve full diagnostic chain-of-custody lineage graph.
- `PUT /api/v1/samples/:id` — Update specimen metadata (blocked once FINALIZED).
- `PATCH /api/v1/samples/:id/status` — Execute validated status transition.

---

## 🔬 Cultures & Media Lineage

- `GET /api/v1/cultures` — List culture plates.
- `POST /api/v1/cultures` — Inoculate culture plate (`CUL-26-XXXXX`) linked to traceable media lot.
- `GET /api/v1/cultures/:id` — Retrieve culture plate details.
- `PATCH /api/v1/cultures/:id/status` — Transition culture status (`INOCULATED`, `INCUBATING`, `COLONIES_ISOLATED`...).

---

## 🧫 Media Inventory

- `GET /api/v1/media` — List traceable media lots (`LOT-BA-...`).
- `POST /api/v1/media` — Register new media lot with expiration date and formulation.
- `GET /api/v1/media/:id` — Retrieve media lot details.

---

## 🔥 Atmospheric Incubations

- `GET /api/v1/incubations` — List incubation chamber records.
- `POST /api/v1/incubations` — Start timed chamber cycle (`INC-26-XXXXX`).
- `GET /api/v1/incubations/:id` — Retrieve incubation details.
- `PATCH /api/v1/incubations/:id/status` — Complete or cancel incubation cycle.

---

## 👁️ Colonial Morphology Observations

- `GET /api/v1/observations` — List morphology readings.
- `POST /api/v1/observations` — Record phenotypic observations (growth, hemolysis, CFU count).
- `GET /api/v1/observations/culture/:cultureId` — List observations for specific culture plate.

---

## 🧬 Biochemical Identification Tests

- `GET /api/v1/tests` — List biochemical tests.
- `POST /api/v1/tests` — Record test execution (`TST-26-XXXXX`) and clinical interpretation.
- `GET /api/v1/tests/culture/:cultureId` — List tests for specific culture plate.

---

## 💊 Antimicrobial Susceptibility Testing (AST)

- `GET /api/v1/ast` — List AST sensitivity records.
- `POST /api/v1/ast/batch` — Submit batch Kirby-Bauer / MIC panel (`AST-26-XXXXX`).
- `GET /api/v1/ast/culture/:cultureId` — Retrieve antibiogram for culture plate.

---

## ⚠️ Contamination & Quarantine

- `GET /api/v1/contamination` — List contamination events (`CON-26-XXXXX`).
- `POST /api/v1/contamination` — Report incident and trigger automatic specimen quarantine.
- `PATCH /api/v1/contamination/:id` — Update incident investigation and resolution.

---

## 📋 Quality Reviews & Electronic Sign-off

- `GET /api/v1/reviews/pending` — List specimens awaiting QA approval.
- `POST /api/v1/reviews/submit` — Microbiologist submits specimen for QA review.
- `POST /api/v1/reviews/sign-off` — QA Reviewer executes electronic sign-off with SHA-256 digital signature.
- `GET /api/v1/reviews` — List historical sign-off records.

---

## 📄 Diagnostic Reports & Checksum Verification

- `POST /api/v1/reports/generate/:sampleId` — Synthesize official PDF report (`RPT-26-XXXXX`).
- `GET /api/v1/reports/:id/preview` — Stream inline PDF for in-browser rendering.
- `GET /api/v1/reports/:id/download` — Download diagnostic PDF binary.
- `POST /api/v1/reports/verify` — Verify tamper-evident SHA-256 checksum.

---

## 📊 Dashboard & Master Audit Trail

- `GET /api/v1/dashboard/metrics` — Aggregated laboratory KPIs (Redis fast cached).
- `GET /api/v1/dashboard/activity` — Real-time laboratory activity timeline.
- `GET /api/v1/audit` — Query immutable master audit trail.
