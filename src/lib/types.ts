export type AppMode = 'shock' | 'lvad' | 'transplant';

export type ScaiStage = 'A' | 'B' | 'C' | 'D' | 'E' | null;

export type Phenotype = 'LV' | 'RV' | 'BiV' | 'Mixed' | 'None' | 'Indeterminate';

export interface HemodynamicsInputs {
  rap: number | null;
  pasp: number | null;
  padp: number | null;
  mpap: number | null;
  pcwp: number | null;
  co: number | null;
  ci: number | null;
  bsa: number | null;
  hr: number | null;
  sbp: number | null;
  dbp: number | null;
  map: number | null;
  // Optional Fick
  useFick: boolean;
  vo2: number | null;
  cao2: number | null;
  cvo2: number | null;
  // SCAI clinical toggles
  hypotensive: boolean;
  hypoperfusion: boolean;
  escalatingSupport: boolean;
  cardiacArrest: boolean;
  lactateElevated: boolean;
  risingCreatinine: boolean;
  risingLft: boolean;
  coldExtremities: boolean;
  mentalStatusChange: boolean;
}

export interface DerivedMetrics {
  map: number | null;
  mpap: number | null;
  co: number | null;
  ci: number | null;
  sv: number | null;
  svi: number | null;
  svr: number | null;
  svri: number | null;
  pvr: number | null;
  pvri: number | null;
  tpg: number | null;
  dpg: number | null;
  cpo: number | null;
  papi: number | null;
  rvswi: number | null;
  lvswi: number | null;
  cvpPcwpRatio: number | null;
}

export interface FlagResult {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  normalLow: number | null;
  normalHigh: number | null;
  status: 'low' | 'normal' | 'high' | 'critical' | 'unknown';
  note?: string;
}

export interface ScaiAssessment {
  suggested: ScaiStage;
  rationale: string[];
}

export interface PhenotypeAssessment {
  phenotype: Phenotype;
  rationale: string[];
}

export const emptyInputs = (): HemodynamicsInputs => ({
  rap: null,
  pasp: null,
  padp: null,
  mpap: null,
  pcwp: null,
  co: null,
  ci: null,
  bsa: null,
  hr: null,
  sbp: null,
  dbp: null,
  map: null,
  useFick: false,
  vo2: null,
  cao2: null,
  cvo2: null,
  hypotensive: false,
  hypoperfusion: false,
  escalatingSupport: false,
  cardiacArrest: false,
  lactateElevated: false,
  risingCreatinine: false,
  risingLft: false,
  coldExtremities: false,
  mentalStatusChange: false,
});
