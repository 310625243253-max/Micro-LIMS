import { query } from '../db/index.js';

let fallbackCounters: Record<string, number> = {
  sample: 1005,
  culture: 1003,
  incubation: 1003,
  test: 1005,
  ast: 1005,
  incident: 1001,
  report: 1001,
};

/**
 * Generate standardized business identifier with current 2-digit year
 * e.g., SMP-26-00001, CUL-26-00001, INC-26-00001
 */
export async function generateBusinessId(
  prefix: 'SMP' | 'CUL' | 'INC' | 'TST' | 'AST' | 'CON' | 'RPT',
  sequenceName: string
): Promise<string> {
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  let nextVal: number;

  try {
    const res = await query(`SELECT nextval('${sequenceName}') as num`);
    nextVal = parseInt(res.rows[0].num, 10);
  } catch {
    // If running in memory mode without sequence support, use atomic fallback
    const key = prefix.toLowerCase();
    fallbackCounters[key] = (fallbackCounters[key] || 1000) + 1;
    nextVal = fallbackCounters[key];
  }

  const padded = nextVal.toString().padStart(5, '0');
  return `${prefix}-${yearSuffix}-${padded}`;
}

export async function nextSampleAccession(): Promise<string> {
  return generateBusinessId('SMP', 'seq_sample_accession');
}

export async function nextCultureCode(): Promise<string> {
  return generateBusinessId('CUL', 'seq_culture_code');
}

export async function nextIncubationCode(): Promise<string> {
  return generateBusinessId('INC', 'seq_incubation_code');
}

export async function nextTestCode(): Promise<string> {
  return generateBusinessId('TST', 'seq_test_code');
}

export async function nextAstCode(): Promise<string> {
  return generateBusinessId('AST', 'seq_ast_code');
}

export async function nextIncidentCode(): Promise<string> {
  return generateBusinessId('CON', 'seq_incident_code');
}

export async function nextReportCode(): Promise<string> {
  return generateBusinessId('RPT', 'seq_report_code');
}
