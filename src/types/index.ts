// ============================================================================
// MicroLIMS - Core Domain & API Type Definitions
// ============================================================================

export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'MICROBIOLOGIST' | 'REVIEWER' | 'VIEWER';

export type SampleType = 'BLOOD' | 'URINE' | 'SPUTUM' | 'SWAB' | 'STOOL' | 'CSF' | 'TISSUE' | 'SYNOVIAL_FLUID' | 'OTHER';
export type Priority = 'ROUTINE' | 'URGENT' | 'STAT';
export type SampleStatus = 'REGISTERED' | 'ACCESSIONED' | 'IN_TESTING' | 'TESTING_COMPLETE' | 'UNDER_REVIEW' | 'APPROVED' | 'FINALIZED' | 'CANCELLED';

export type CultureStatus = 'INOCULATED' | 'INCUBATING' | 'OBSERVED' | 'DISCARDED' | 'CONTAMINATED';
export type InoculationMethod = 'STREAK_4_QUADRANT' | 'POUR_PLATE' | 'LAWN_CULTURE' | 'BROTH_INOCULATION';

export type IncubationStatus = 'SCHEDULED' | 'RUNNING' | 'DUE' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
export type Atmosphere = 'AEROBIC' | 'ANAEROBIC' | 'MICROAEROPHILIC' | 'CO2_5_PERCENT';

export type GrowthStatus = 'NO_GROWTH' | 'SCANT_GROWTH' | 'MODERATE_GROWTH' | 'HEAVY_GROWTH';
export type Hemolysis = 'ALPHA' | 'BETA' | 'GAMMA' | 'NONE';

export type AstMethod = 'KIRBY_BAUER_DISC' | 'MIC_BROTH_DILUTION' | 'E_TEST';
export type AstInterpretation = 'SUSCEPTIBLE' | 'INTERMEDIATE' | 'RESISTANT' | 'NOT_INTERPRETED';

export type ContaminationCategory = 'MEDIA_CONTAMINATION' | 'CROSS_CONTAMINATION' | 'ENVIRONMENTAL' | 'TECHNIQUE_ERROR' | 'EQUIPMENT_FAILURE';
export type ContaminationStatus = 'SUSPECTED' | 'QUARANTINED' | 'INVESTIGATED' | 'RESOLVED';

export type ReviewStage = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'FINALIZED';
export type ReviewDecision = 'APPROVE' | 'REJECT' | 'AMEND';

// ----------------------------------------------------------------------------
// Entity Models
// ----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  title?: string | null;
  is_active: boolean;
  roles?: UserRole[];
  created_at: Date;
  updated_at: Date;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface MediaLot {
  id: string;
  lot_number: string;
  media_name: string;
  manufacturer: string;
  received_date: string;
  expiry_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'QUARANTINED' | 'DEPLETED';
  storage_conditions?: string | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Reagent {
  id: string;
  reagent_name: string;
  lot_number: string;
  manufacturer: string;
  received_date: string;
  expiry_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'QUARANTINED';
  created_at: Date;
  updated_at: Date;
}

export interface Sample {
  id: string;
  accession_number: string;
  patient_synthetic_id: string;
  patient_synthetic_name?: string | null;
  sample_type: SampleType;
  collection_site: string;
  priority: Priority;
  status: SampleStatus;
  collected_at: Date;
  received_at: Date;
  accessioned_by: string;
  accessioned_by_name?: string;
  clinical_notes?: string | null;
  quarantined: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Culture {
  id: string;
  culture_code: string;
  sample_id: string;
  sample_accession_number?: string;
  media_lot_id?: string | null;
  media_lot_number?: string | null;
  media_type: string;
  inoculation_method: InoculationMethod;
  inoculated_at: Date;
  inoculated_by: string;
  inoculated_by_name?: string;
  status: CultureStatus;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Incubation {
  id: string;
  incubation_code: string;
  culture_id: string;
  culture_code?: string;
  incubator_id: string;
  temperature_celsius: number;
  atmosphere: Atmosphere;
  duration_hours: number;
  started_at: Date;
  expected_completion_at: Date;
  completed_at?: Date | null;
  status: IncubationStatus;
  operator_notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Observation {
  id: string;
  culture_id: string;
  growth_detected: boolean;
  growth_status: GrowthStatus;
  colony_morphology?: string | null;
  pigmentation?: string | null;
  hemolysis: Hemolysis;
  colony_count_cfu?: string | null;
  observed_at: Date;
  observed_by: string;
  observed_by_name?: string;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestRecord {
  id: string;
  test_code: string;
  culture_id: string;
  test_name: string;
  method: string;
  raw_result: string;
  interpretation: string;
  performed_by: string;
  performed_by_name?: string;
  performed_at: Date;
  status: string;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AstRecord {
  id: string;
  ast_code: string;
  culture_id: string;
  organism_identified: string;
  antibiotic_name: string;
  method: AstMethod;
  zone_diameter_mm?: number | null;
  mic_value_ug_ml?: number | null;
  interpretation: AstInterpretation;
  reference_guideline: string;
  technician_id: string;
  technician_name?: string;
  recorded_at: Date;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ContaminationIncident {
  id: string;
  incident_code: string;
  sample_id?: string | null;
  culture_id?: string | null;
  detection_date: Date;
  category: ContaminationCategory;
  description: string;
  suspected_cause?: string | null;
  corrective_action?: string | null;
  status: ContaminationStatus;
  reported_by: string;
  reported_by_name?: string;
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  resolution_date?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewRecord {
  id: string;
  sample_id: string;
  stage: ReviewStage;
  decision: ReviewDecision;
  comments?: string | null;
  rejection_reason?: string | null;
  amendment_reason?: string | null;
  electronic_signature_hash: string;
  signer_name: string;
  signer_title: string;
  reviewer_id: string;
  reviewed_at: Date;
  created_at: Date;
}

export interface ReportRecord {
  id: string;
  report_code: string;
  sample_id: string;
  generated_by: string;
  report_type: string;
  pdf_filename: string;
  checksum_sha256: string;
  generated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_state?: any;
  new_state?: any;
  reason?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date;
}

// ----------------------------------------------------------------------------
// API Payloads & Auth Context
// ----------------------------------------------------------------------------

export interface JwtAuthPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  firstName: string;
  lastName: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}
