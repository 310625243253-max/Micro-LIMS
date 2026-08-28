-- ============================================================================
-- MicroLIMS - Migration 001: Initial Relational Database Schema
-- Standard PostgreSQL DDL for 14 Core Entities with Constraints & Indexes
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST', 'REVIEWER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sample_type_enum AS ENUM ('BLOOD', 'URINE', 'SPUTUM', 'SWAB', 'STOOL', 'CSF', 'TISSUE', 'SYNOVIAL_FLUID', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_enum AS ENUM ('ROUTINE', 'URGENT', 'STAT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sample_status_enum AS ENUM ('REGISTERED', 'ACCESSIONED', 'IN_TESTING', 'TESTING_COMPLETE', 'UNDER_REVIEW', 'APPROVED', 'FINALIZED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE culture_status_enum AS ENUM ('INOCULATED', 'INCUBATING', 'OBSERVED', 'DISCARDED', 'CONTAMINATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incubation_status_enum AS ENUM ('SCHEDULED', 'RUNNING', 'DUE', 'COMPLETED', 'OVERDUE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE atmosphere_enum AS ENUM ('AEROBIC', 'ANAEROBIC', 'MICROAEROPHILIC', 'CO2_5_PERCENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hemolysis_enum AS ENUM ('ALPHA', 'BETA', 'GAMMA', 'NONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ast_method_enum AS ENUM ('KIRBY_BAUER_DISC', 'MIC_BROTH_DILUTION', 'E_TEST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ast_interpretation_enum AS ENUM ('SUSCEPTIBLE', 'INTERMEDIATE', 'RESISTANT', 'NOT_INTERPRETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contamination_status_enum AS ENUM ('SUSPECTED', 'QUARANTINED', 'INVESTIGATED', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contamination_category_enum AS ENUM ('MEDIA_CONTAMINATION', 'CROSS_CONTAMINATION', 'ENVIRONMENTAL', 'TECHNIQUE_ERROR', 'EQUIPMENT_FAILURE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_stage_enum AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'FINALIZED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_decision_enum AS ENUM ('APPROVE', 'REJECT', 'AMEND');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lot_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'QUARANTINED', 'DEPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Users and Roles Tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 4. Inventory: Media Lots and Reagents
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_number VARCHAR(100) UNIQUE NOT NULL,
    media_name VARCHAR(150) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    storage_conditions VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reagents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reagent_name VARCHAR(150) NOT NULL,
    lot_number VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Samples (Specimen Accessioning)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accession_number VARCHAR(50) UNIQUE NOT NULL,
    patient_synthetic_id VARCHAR(100) NOT NULL,
    patient_synthetic_name VARCHAR(150),
    sample_type VARCHAR(50) NOT NULL,
    collection_site VARCHAR(150) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'ROUTINE',
    status VARCHAR(50) NOT NULL DEFAULT 'ACCESSIONED',
    collected_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accessioned_by UUID NOT NULL REFERENCES users(id),
    clinical_notes TEXT,
    quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. Cultures (Sample-to-Media Lineage)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cultures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    culture_code VARCHAR(50) UNIQUE NOT NULL,
    sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE RESTRICT,
    media_lot_id UUID REFERENCES media_lots(id) ON DELETE SET NULL,
    media_type VARCHAR(150) NOT NULL,
    inoculation_method VARCHAR(100) NOT NULL DEFAULT 'STREAK_4_QUADRANT',
    inoculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inoculated_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'INOCULATED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. Incubations (Scheduling & Atmosphere Tracking)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS incubations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incubation_code VARCHAR(50) UNIQUE NOT NULL,
    culture_id UUID NOT NULL REFERENCES cultures(id) ON DELETE CASCADE,
    incubator_id VARCHAR(50) NOT NULL,
    temperature_celsius NUMERIC(4, 1) NOT NULL DEFAULT 37.0,
    atmosphere VARCHAR(50) NOT NULL DEFAULT 'AEROBIC',
    duration_hours INTEGER NOT NULL DEFAULT 24,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_completion_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
    operator_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_temp_range CHECK (temperature_celsius >= 0.0 AND temperature_celsius <= 80.0),
    CONSTRAINT chk_duration_positive CHECK (duration_hours > 0)
);

-- ----------------------------------------------------------------------------
-- 8. Colonial Morphology & Growth Observations
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    culture_id UUID NOT NULL REFERENCES cultures(id) ON DELETE CASCADE,
    growth_detected BOOLEAN NOT NULL DEFAULT FALSE,
    growth_status VARCHAR(50) NOT NULL DEFAULT 'HEAVY_GROWTH',
    colony_morphology TEXT,
    pigmentation VARCHAR(100),
    hemolysis VARCHAR(50) NOT NULL DEFAULT 'NONE',
    colony_count_cfu VARCHAR(100),
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. Biochemical & Identification Tests
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_code VARCHAR(50) UNIQUE NOT NULL,
    culture_id UUID NOT NULL REFERENCES cultures(id) ON DELETE CASCADE,
    test_name VARCHAR(150) NOT NULL,
    method VARCHAR(150) NOT NULL,
    raw_result VARCHAR(150) NOT NULL,
    interpretation VARCHAR(255) NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. Antimicrobial Susceptibility Testing (AST)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ast_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ast_code VARCHAR(50) UNIQUE NOT NULL,
    culture_id UUID NOT NULL REFERENCES cultures(id) ON DELETE CASCADE,
    organism_identified VARCHAR(150) NOT NULL,
    antibiotic_name VARCHAR(150) NOT NULL,
    method VARCHAR(50) NOT NULL DEFAULT 'KIRBY_BAUER_DISC',
    zone_diameter_mm NUMERIC(4, 1),
    mic_value_ug_ml NUMERIC(8, 3),
    interpretation VARCHAR(50) NOT NULL DEFAULT 'SUSCEPTIBLE',
    reference_guideline VARCHAR(100) NOT NULL DEFAULT 'CLSI-M100-DEMO',
    technician_id UUID NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_zone_positive CHECK (zone_diameter_mm IS NULL OR zone_diameter_mm >= 0.0),
    CONSTRAINT chk_mic_positive CHECK (mic_value_ug_ml IS NULL OR mic_value_ug_ml >= 0.0)
);

-- ----------------------------------------------------------------------------
-- 11. Contamination & Incident Management
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS contamination_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_code VARCHAR(50) UNIQUE NOT NULL,
    sample_id UUID REFERENCES samples(id) ON DELETE SET NULL,
    culture_id UUID REFERENCES cultures(id) ON DELETE SET NULL,
    detection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    suspected_cause TEXT,
    corrective_action TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SUSPECTED',
    reported_by UUID NOT NULL REFERENCES users(id),
    resolved_by UUID REFERENCES users(id),
    resolution_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. Reviews and Electronic Sign-offs
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    decision VARCHAR(50) NOT NULL DEFAULT 'APPROVE',
    comments TEXT,
    rejection_reason TEXT,
    amendment_reason TEXT,
    electronic_signature_hash VARCHAR(255) NOT NULL,
    signer_name VARCHAR(150) NOT NULL,
    signer_title VARCHAR(150) NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. Reports (Final Output Tracking)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_code VARCHAR(50) UNIQUE NOT NULL,
    sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    generated_by UUID NOT NULL REFERENCES users(id),
    report_type VARCHAR(50) NOT NULL DEFAULT 'FINAL_MICROBIOLOGY_REPORT',
    pdf_filename VARCHAR(255) NOT NULL,
    checksum_sha256 VARCHAR(255) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. Audit Logs (Immutable Master Log)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 15. Performance Indexes
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_samples_accession ON samples(accession_number);
CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
CREATE INDEX IF NOT EXISTS idx_samples_priority ON samples(priority);
CREATE INDEX IF NOT EXISTS idx_samples_created_at ON samples(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cultures_sample_id ON cultures(sample_id);
CREATE INDEX IF NOT EXISTS idx_cultures_code ON cultures(culture_code);
CREATE INDEX IF NOT EXISTS idx_cultures_status ON cultures(status);

CREATE INDEX IF NOT EXISTS idx_incubations_culture_id ON incubations(culture_id);
CREATE INDEX IF NOT EXISTS idx_incubations_status ON incubations(status);
CREATE INDEX IF NOT EXISTS idx_incubations_due_time ON incubations(expected_completion_at);

CREATE INDEX IF NOT EXISTS idx_observations_culture_id ON observations(culture_id);
CREATE INDEX IF NOT EXISTS idx_tests_culture_id ON tests(culture_id);
CREATE INDEX IF NOT EXISTS idx_ast_culture_id ON ast_records(culture_id);
CREATE INDEX IF NOT EXISTS idx_reviews_sample_id ON reviews(sample_id);
CREATE INDEX IF NOT EXISTS idx_reports_sample_id ON reports(sample_id);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
