# MicroLIMS Database Schema & Entity Relationship Model

## 1. Schema Tables

### Core Laboratory Tables

| Table | Primary Key | Purpose | Key Foreign Keys |
| :--- | :--- | :--- | :--- |
| `users` | `id` (UUID) | System operators & credentials | - |
| `user_roles` | `user_id, role` | RBAC role assignments | `users(id)` |
| `media_lots` | `id` (UUID) | Reagent batches & expiration dates | - |
| `samples` | `id` (UUID) | Clinical specimens & state machine | `users(accessioned_by)` |
| `cultures` | `id` (UUID) | Inoculated media plates | `samples(id)`, `media_lots(id)`, `users(inoculated_by)` |
| `incubations` | `id` (UUID) | Chamber cycles & timing parameters | `cultures(id)` |
| `observations` | `id` (UUID) | Colonial morphology readings | `cultures(id)`, `users(observed_by)` |
| `tests` | `id` (UUID) | Biochemical identification battery | `cultures(id)`, `users(performed_by)` |
| `ast_records` | `id` (UUID) | Kirby-Bauer & MIC susceptibility | `cultures(id)`, `users(technician_id)` |
| `contamination_incidents`| `id` (UUID) | Biohazard / quality incidents | `samples(id)`, `cultures(id)`, `users(reported_by)` |
| `reviews` | `id` (UUID) | Quality assurance & digital sign-offs| `samples(id)`, `users(reviewer_id)` |
| `reports` | `id` (UUID) | Signed diagnostic PDF documents | `samples(id)`, `users(generated_by)` |
| `audit_logs` | `id` (UUID) | Append-only immutable forensic log | `users(user_id)` |

---

## 2. Sequence Identifiers

MicroLIMS auto-generates deterministic clinical accession codes:

- Specimens: `SMP-26-XXXXX`
- Cultures: `CUL-26-XXXXX`
- Incubations: `INC-26-XXXXX`
- Biochemical Tests: `TST-26-XXXXX`
- AST Panels: `AST-26-XXXXX`
- Incidents: `CON-26-XXXXX`
- Reports: `RPT-26-XXXXX`

---

## 3. Database Indexes & Performance Optimizations

1. **B-Tree Indexes**:
   - `samples`: `accession_number`, `status`, `priority`, `collected_at`
   - `cultures`: `sample_id`, `culture_code`, `status`
   - `incubations`: `culture_id`, `status`, `expected_completion_at`
   - `tests`: `culture_id`, `status`
   - `ast_records`: `culture_id`, `organism_identified`
   - `reviews`: `sample_id`, `stage`, `decision`
   - `audit_logs`: `entity_type`, `entity_id`, `action`, `created_at`
