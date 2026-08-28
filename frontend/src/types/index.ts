export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'MICROBIOLOGIST' | 'REVIEWER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  title?: string | null;
  roles?: UserRole[];
}

export type SampleStatus =
  | 'REGISTERED'
  | 'ACCESSIONED'
  | 'IN_TESTING'
  | 'TESTING_COMPLETE'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'FINALIZED'
  | 'CANCELLED';

export type Priority = 'ROUTINE' | 'URGENT' | 'STAT';

export interface Sample {
  id: string;
  accession_number: string;
  patient_synthetic_id: string;
  patient_synthetic_name?: string | null;
  sample_type: string;
  collection_site: string;
  priority: Priority;
  status: SampleStatus;
  collected_at: string;
  received_at: string;
  accessioned_by_name?: string;
  clinical_notes?: string | null;
  quarantined: boolean;
  created_at: string;
  updated_at: string;
}

export interface Culture {
  id: string;
  culture_code: string;
  sample_id: string;
  sample_accession_number?: string;
  media_lot_id?: string | null;
  media_lot_number?: string | null;
  media_type: string;
  inoculation_method: string;
  inoculated_at: string;
  inoculated_by_name?: string;
  status: string;
  notes?: string | null;
}

export interface MediaLot {
  id: string;
  lot_number: string;
  media_name: string;
  manufacturer: string;
  received_date: string;
  expiry_date: string;
  status: string;
  storage_conditions?: string | null;
  notes?: string | null;
}

export interface Incubation {
  id: string;
  incubation_code: string;
  culture_id: string;
  culture_code?: string;
  incubator_id: string;
  temperature_celsius: number;
  atmosphere: string;
  duration_hours: number;
  started_at: string;
  expected_completion_at: string;
  completed_at?: string | null;
  status: 'SCHEDULED' | 'RUNNING' | 'DUE' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  operator_notes?: string | null;
}

export interface Observation {
  id: string;
  culture_id: string;
  growth_detected: boolean;
  growth_status: string;
  colony_morphology?: string | null;
  pigmentation?: string | null;
  hemolysis: string;
  colony_count_cfu?: string | null;
  observed_at: string;
  observed_by_name?: string;
  notes?: string | null;
}

export interface TestRecord {
  id: string;
  test_code: string;
  culture_id: string;
  test_name: string;
  method: string;
  raw_result: string;
  interpretation: string;
  performed_by_name?: string;
  performed_at: string;
  status: string;
  notes?: string | null;
}

export interface AstRecord {
  id: string;
  ast_code: string;
  culture_id: string;
  organism_identified: string;
  antibiotic_name: string;
  method: string;
  zone_diameter_mm?: number | null;
  mic_value_ug_ml?: number | null;
  interpretation: 'SUSCEPTIBLE' | 'INTERMEDIATE' | 'RESISTANT' | 'NOT_INTERPRETED';
  reference_guideline: string;
  technician_name?: string;
  recorded_at: string;
  notes?: string | null;
}

export interface ContaminationIncident {
  id: string;
  incident_code: string;
  sample_id?: string | null;
  culture_id?: string | null;
  detection_date: string;
  category: string;
  description: string;
  suspected_cause?: string | null;
  corrective_action?: string | null;
  status: string;
  reported_by_name?: string;
  resolved_by_name?: string | null;
  resolution_date?: string | null;
}

export interface ReviewRecord {
  id: string;
  sample_id: string;
  stage: string;
  decision: string;
  comments?: string | null;
  rejection_reason?: string | null;
  amendment_reason?: string | null;
  electronic_signature_hash: string;
  signer_name: string;
  signer_title: string;
  reviewer_name?: string;
  reviewed_at: string;
}

export interface ReportRecord {
  id: string;
  report_code: string;
  sample_id: string;
  accession_number?: string;
  generated_by_name?: string;
  report_type: string;
  pdf_filename: string;
  checksum_sha256: string;
  generated_at: string;
}

export interface AuditLog {
  id: string;
  user_email?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_state?: any;
  new_state?: any;
  reason?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface DashboardMetrics {
  totalSamples: number;
  samplesToday: number;
  activeCultures: number;
  runningIncubations: number;
  dueIncubations: number;
  overdueIncubations: number;
  pendingTests: number;
  pendingReviews: number;
  contaminationIncidents: number;
  quarantinedSamples: number;
  samplesByPriority: { priority: string; count: number }[];
  samplesByStatus: { status: string; count: number }[];
  samplesByType: { type: string; count: number }[];
}
