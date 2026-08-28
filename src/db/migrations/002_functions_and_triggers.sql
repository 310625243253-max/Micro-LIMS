-- ============================================================================
-- MicroLIMS - Migration 002: Helper Sequences, Functions & Triggers
-- ============================================================================

-- 1. Sequences for Human-Readable Business Identifiers
CREATE SEQUENCE IF NOT EXISTS seq_sample_accession START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_culture_code START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_incubation_code START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_test_code START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_ast_code START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_incident_code START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_report_code START WITH 1001 INCREMENT BY 1;

-- 2. Trigger Function: Automatically Update updated_at Timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply Trigger to Tables with updated_at
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_samples_updated_at ON samples;
CREATE TRIGGER trg_samples_updated_at
BEFORE UPDATE ON samples
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_media_lots_updated_at ON media_lots;
CREATE TRIGGER trg_media_lots_updated_at
BEFORE UPDATE ON media_lots
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_reagents_updated_at ON reagents;
CREATE TRIGGER trg_reagents_updated_at
BEFORE UPDATE ON reagents
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_cultures_updated_at ON cultures;
CREATE TRIGGER trg_cultures_updated_at
BEFORE UPDATE ON cultures
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_incubations_updated_at ON incubations;
CREATE TRIGGER trg_incubations_updated_at
BEFORE UPDATE ON incubations
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_observations_updated_at ON observations;
CREATE TRIGGER trg_observations_updated_at
BEFORE UPDATE ON observations
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_tests_updated_at ON tests;
CREATE TRIGGER trg_tests_updated_at
BEFORE UPDATE ON tests
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_ast_records_updated_at ON ast_records;
CREATE TRIGGER trg_ast_records_updated_at
BEFORE UPDATE ON ast_records
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_contamination_updated_at ON contamination_incidents;
CREATE TRIGGER trg_contamination_updated_at
BEFORE UPDATE ON contamination_incidents
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
