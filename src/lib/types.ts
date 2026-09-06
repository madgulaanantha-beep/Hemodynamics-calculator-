export type AppMode = 'shock' | 'lvad' | 'transplant';

export type ScaiStage = 'A' | 'B' | 'C' | 'D' | 'E' | null;

export type Phenotype = 'LV' | 'RV' | 'BiV' | 'Mixed' | 'None' | 'Indeterminate';

/** VO₂ source for indirect Fick */
export type Vo2Mode = 'estimated' | 'measured' | 'lafarge';

/** Sex used by LaFarge VO₂ estimate */
export type Sex = 'male' | 'female';

export interface HemodynamicsInputs {
  rap: number | null;
  pasp: number | null;
  padp: number | null;
  mpap: number | null;
  pcwp: number | null;
  /** Thermodilution / entered CO (L/min) — used when useFick is false */
  co: number | null;
  ci: number | null;
  bsa: number | null;
  heightCm: number | null;
  weightKg: number | null;
  hr: number | null;
  sbp: number | null;
  dbp: number | null;
  map: number | null;
  /** When true, derived CO/CI come from indirect Fick instead of thermo CO */
  useFick: boolean;
  /** Indirect Fick inputs */
  hb: number | null;
  sao2: number | null;
  svo2: number | null;
  /** Hufner / O₂ binding constant (mL O₂ per g Hb); default 1.36 */
  o2Binding: number | null;
  vo2Mode: Vo2Mode;
  /** Dehmer-style VO₂ index (mL/min/m²); default 125 */
  vo2Constant: number | null;
  /** Measured / manually entered VO₂ (mL/min) */
  vo2Measured: number | null;
  /** LaFarge age (years) */
  ageYears: number | null;
  sex: Sex | null;
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
  /** Effective CO used for SVR/PVR/CPO etc. (Fick or thermo) */
  co: number | null;
  ci: number | null;
  /** Resolved BSA (direct or Mosteller from height/weight) */
  bsa: number | null;
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
  /** Indirect Fick intermediates */
  fickVo2: number | null;
  fickAvO2Diff: number | null;
  fickCo: number | null;
  fickCi: number | null;
  coSource: 'thermo' | 'fick' | 'ci_bsa' | null;
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

export const DEFAULT_VO2_CONSTANT = 125;
export const DEFAULT_O2_BINDING = 1.36;

export const emptyInputs = (): HemodynamicsInputs => ({
  rap: null,
  pasp: null,
  padp: null,
  mpap: null,
  pcwp: null,
  co: null,
  ci: null,
  bsa: null,
  heightCm: null,
  weightKg: null,
  hr: null,
  sbp: null,
  dbp: null,
  map: null,
  useFick: false,
  hb: null,
  sao2: null,
  svo2: null,
  o2Binding: DEFAULT_O2_BINDING,
  vo2Mode: 'estimated',
  vo2Constant: DEFAULT_VO2_CONSTANT,
  vo2Measured: null,
  ageYears: null,
  sex: null,
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
