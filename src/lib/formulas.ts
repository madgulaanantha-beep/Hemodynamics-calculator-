import type {
  DerivedMetrics,
  FlagResult,
  HemodynamicsInputs,
  PhenotypeAssessment,
  ScaiAssessment,
  Sex,
  Vo2Mode,
} from './types';
import { DEFAULT_O2_BINDING, DEFAULT_VO2_CONSTANT } from './types';

/** Round to `digits` decimal places; null-safe. */
export function round(n: number | null | undefined, digits = 2): number | null {
  if (n === null || n === undefined || Number.isNaN(n) || !Number.isFinite(n)) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function isPresent(n: number | null | undefined): n is number {
  return n !== null && n !== undefined && Number.isFinite(n);
}

/** MAP = DBP + (SBP − DBP) / 3 */
export function calcMap(sbp: number | null, dbp: number | null, mapOverride: number | null): number | null {
  if (isPresent(mapOverride)) return mapOverride;
  if (isPresent(sbp) && isPresent(dbp)) return dbp + (sbp - dbp) / 3;
  return null;
}

/** mPAP = PADP + (PASP − PADP) / 3 */
export function calcMpap(pasp: number | null, padp: number | null, mpapOverride: number | null): number | null {
  if (isPresent(mpapOverride)) return mpapOverride;
  if (isPresent(pasp) && isPresent(padp)) return padp + (pasp - padp) / 3;
  return null;
}

/**
 * Mosteller BSA (m²) = √(height_cm × weight_kg / 3600)
 */
export function calcBsaMosteller(heightCm: number | null, weightKg: number | null): number | null {
  if (!isPresent(heightCm) || !isPresent(weightKg) || heightCm <= 0 || weightKg <= 0) return null;
  return Math.sqrt((heightCm * weightKg) / 3600);
}

/** Prefer direct BSA; else Mosteller from height/weight. */
export function resolveBsa(inputs: HemodynamicsInputs): number | null {
  if (isPresent(inputs.bsa) && inputs.bsa > 0) return inputs.bsa;
  return calcBsaMosteller(inputs.heightCm, inputs.weightKg);
}

/**
 * Arteriovenous O₂ content difference in mL O₂ per L blood.
 *
 * Formula (Sa/Sv as percentages 0–100):
 *   CaO₂ − CvO₂ (mL/L) = Hb (g/dL) × Hufner × (SaO₂% − SvO₂%) / 10
 *
 * Default Hufner (O₂ binding) = 1.36 mL O₂ / g Hb.
 * Equivalents:
 *   - With fractions: Hb × 1.36 × (Sa − Sv) × 10
 *   - Content in mL/dL then ×10: Hb × 1.36 × ΔSat%/100 × 10 = same
 *
 * Dissolved O₂ (0.0031 × PaO₂) is omitted (standard indirect Fick bedside form).
 */
export function calcAvO2DiffMlPerL(
  hb: number | null,
  sao2Pct: number | null,
  svo2Pct: number | null,
  o2Binding: number | null = DEFAULT_O2_BINDING,
): number | null {
  if (!isPresent(hb) || !isPresent(sao2Pct) || !isPresent(svo2Pct) || hb <= 0) return null;
  const hufner = isPresent(o2Binding) && o2Binding > 0 ? o2Binding : DEFAULT_O2_BINDING;
  const delta = sao2Pct - svo2Pct;
  if (delta <= 0) return null;
  return (hb * hufner * delta) / 10;
}

/**
 * Estimated VO₂ (Dehmer-style): VO₂ (mL/min) = constant (mL/min/m²) × BSA (m²).
 * Default constant = 125 (commonly 110–150 range clinically).
 */
export function calcVo2Estimated(
  bsa: number | null,
  constant: number | null = DEFAULT_VO2_CONSTANT,
): number | null {
  if (!isPresent(bsa) || bsa <= 0) return null;
  const k = isPresent(constant) && constant > 0 ? constant : DEFAULT_VO2_CONSTANT;
  return k * bsa;
}

/**
 * LaFarge & Miettinen estimated VO₂ (mL/min):
 *   Male:   (138.1 − 11.49 × ln(age) + 0.378 × HR) × BSA
 *   Female: (138.1 − 17.04 × ln(age) + 0.378 × HR) × BSA
 * Age in years, HR in bpm, BSA in m².
 */
export function calcVo2LaFarge(
  bsa: number | null,
  ageYears: number | null,
  hr: number | null,
  sex: Sex | null,
): number | null {
  if (!isPresent(bsa) || bsa <= 0) return null;
  if (!isPresent(ageYears) || ageYears <= 0) return null;
  if (!isPresent(hr) || hr <= 0) return null;
  if (sex !== 'male' && sex !== 'female') return null;
  const ageTerm = sex === 'male' ? 11.49 : 17.04;
  const index = 138.1 - ageTerm * Math.log(ageYears) + 0.378 * hr;
  if (index <= 0) return null;
  return index * bsa;
}

/** Resolve VO₂ (mL/min) from mode + inputs. */
export function resolveVo2(inputs: HemodynamicsInputs, bsa: number | null): number | null {
  const mode: Vo2Mode = inputs.vo2Mode ?? 'estimated';
  if (mode === 'measured') {
    return isPresent(inputs.vo2Measured) && inputs.vo2Measured > 0 ? inputs.vo2Measured : null;
  }
  if (mode === 'lafarge') {
    return calcVo2LaFarge(bsa, inputs.ageYears, inputs.hr, inputs.sex);
  }
  return calcVo2Estimated(bsa, inputs.vo2Constant);
}

/**
 * Indirect Fick CO (L/min) = VO₂ (mL/min) / [CaO₂ − CvO₂] (mL O₂ / L blood)
 */
export function calcIndirectFickCo(vo2: number | null, avO2DiffMlPerL: number | null): number | null {
  if (!isPresent(vo2) || !isPresent(avO2DiffMlPerL) || vo2 <= 0 || avO2DiffMlPerL <= 0) return null;
  return vo2 / avO2DiffMlPerL;
}

/**
 * Legacy helper: Fick CO when CaO₂/CvO₂ are already in mL O₂/dL.
 * CO = VO₂ / ((CaO₂ − CvO₂) × 10)
 */
export function calcFickCo(vo2: number | null, cao2: number | null, cvo2: number | null): number | null {
  if (!isPresent(vo2) || !isPresent(cao2) || !isPresent(cvo2)) return null;
  const avDiff = cao2 - cvo2;
  if (avDiff <= 0) return null;
  return vo2 / (avDiff * 10);
}

/** Full indirect Fick bundle from hemodynamics inputs. */
export function computeIndirectFick(inputs: HemodynamicsInputs): {
  bsa: number | null;
  vo2: number | null;
  avO2Diff: number | null;
  co: number | null;
  ci: number | null;
} {
  const bsa = resolveBsa(inputs);
  const vo2 = resolveVo2(inputs, bsa);
  const avO2Diff = calcAvO2DiffMlPerL(inputs.hb, inputs.sao2, inputs.svo2, inputs.o2Binding);
  const co = calcIndirectFickCo(vo2, avO2Diff);
  const ci = isPresent(co) && isPresent(bsa) && bsa > 0 ? co / bsa : null;
  return { bsa, vo2, avO2Diff, co, ci };
}

/** Resolve CO from Fick (preferred when toggled), direct entry, or CI×BSA. */
export function resolveCo(inputs: HemodynamicsInputs): {
  co: number | null;
  source: DerivedMetrics['coSource'];
  fick: ReturnType<typeof computeIndirectFick>;
} {
  const fick = computeIndirectFick(inputs);
  if (inputs.useFick) {
    if (isPresent(fick.co)) return { co: fick.co, source: 'fick', fick };
  }
  if (isPresent(inputs.co)) return { co: inputs.co, source: 'thermo', fick };
  const bsa = fick.bsa;
  if (isPresent(inputs.ci) && isPresent(bsa) && bsa > 0) {
    return { co: inputs.ci * bsa, source: 'ci_bsa', fick };
  }
  return { co: null, source: null, fick };
}

/** Resolve CI from direct entry or CO/BSA. */
export function resolveCi(
  inputs: HemodynamicsInputs,
  co: number | null,
  bsa: number | null,
  coSource: DerivedMetrics['coSource'],
): number | null {
  // When Fick is the CO source, prefer Fick CI (CO/BSA) over a stale thermo CI entry
  if (coSource === 'fick' && isPresent(co) && isPresent(bsa) && bsa > 0) return co / bsa;
  if (isPresent(inputs.ci) && coSource !== 'fick') return inputs.ci;
  if (isPresent(co) && isPresent(bsa) && bsa > 0) return co / bsa;
  return null;
}

/** SV (mL) = (CO L/min × 1000) / HR */
export function calcSv(co: number | null, hr: number | null): number | null {
  if (!isPresent(co) || !isPresent(hr) || hr <= 0) return null;
  return (co * 1000) / hr;
}

/** SVI (mL/m²) = SV / BSA */
export function calcSvi(sv: number | null, bsa: number | null): number | null {
  if (!isPresent(sv) || !isPresent(bsa) || bsa <= 0) return null;
  return sv / bsa;
}

/** SVR (dyn·s·cm⁻⁵) = 80 × (MAP − RAP) / CO */
export function calcSvr(map: number | null, rap: number | null, co: number | null): number | null {
  if (!isPresent(map) || !isPresent(rap) || !isPresent(co) || co <= 0) return null;
  return (80 * (map - rap)) / co;
}

/** SVRI (dyn·s·cm⁻⁵·m²) = 80 × (MAP − RAP) / CI */
export function calcSvri(map: number | null, rap: number | null, ci: number | null): number | null {
  if (!isPresent(map) || !isPresent(rap) || !isPresent(ci) || ci <= 0) return null;
  return (80 * (map - rap)) / ci;
}

/** PVR (WU) = (mPAP − PCWP) / CO */
export function calcPvr(mpap: number | null, pcwp: number | null, co: number | null): number | null {
  if (!isPresent(mpap) || !isPresent(pcwp) || !isPresent(co) || co <= 0) return null;
  return (mpap - pcwp) / co;
}

/** PVRI (WU·m²) = (mPAP − PCWP) / CI */
export function calcPvri(mpap: number | null, pcwp: number | null, ci: number | null): number | null {
  if (!isPresent(mpap) || !isPresent(pcwp) || !isPresent(ci) || ci <= 0) return null;
  return (mpap - pcwp) / ci;
}

/** TPG (mmHg) = mPAP − PCWP */
export function calcTpg(mpap: number | null, pcwp: number | null): number | null {
  if (!isPresent(mpap) || !isPresent(pcwp)) return null;
  return mpap - pcwp;
}

/** DPG (mmHg) = PADP − PCWP */
export function calcDpg(padp: number | null, pcwp: number | null): number | null {
  if (!isPresent(padp) || !isPresent(pcwp)) return null;
  return padp - pcwp;
}

/** CPO (W) = (MAP × CO) / 451 */
export function calcCpo(map: number | null, co: number | null): number | null {
  if (!isPresent(map) || !isPresent(co)) return null;
  return (map * co) / 451;
}

/** PAPi = (PASP − PADP) / RAP */
export function calcPapi(pasp: number | null, padp: number | null, rap: number | null): number | null {
  if (!isPresent(pasp) || !isPresent(padp) || !isPresent(rap) || rap === 0) return null;
  return (pasp - padp) / rap;
}

/** RVSWI (g·m/m²) = (mPAP − RAP) × SVI × 0.0136 */
export function calcRvswi(mpap: number | null, rap: number | null, svi: number | null): number | null {
  if (!isPresent(mpap) || !isPresent(rap) || !isPresent(svi)) return null;
  return (mpap - rap) * svi * 0.0136;
}

/** LVSWI (g·m/m²) = (MAP − PCWP) × SVI × 0.0136 */
export function calcLvswi(map: number | null, pcwp: number | null, svi: number | null): number | null {
  if (!isPresent(map) || !isPresent(pcwp) || !isPresent(svi)) return null;
  return (map - pcwp) * svi * 0.0136;
}

/** CVP/PCWP ratio */
export function calcCvpPcwp(rap: number | null, pcwp: number | null): number | null {
  if (!isPresent(rap) || !isPresent(pcwp) || pcwp === 0) return null;
  return rap / pcwp;
}

export function deriveAll(inputs: HemodynamicsInputs): DerivedMetrics {
  const map = calcMap(inputs.sbp, inputs.dbp, inputs.map);
  const mpap = calcMpap(inputs.pasp, inputs.padp, inputs.mpap);
  const { co, source, fick } = resolveCo(inputs);
  const bsa = fick.bsa;
  const ci = resolveCi(inputs, co, bsa, source);
  const sv = calcSv(co, inputs.hr);
  const svi = calcSvi(sv, bsa);

  return {
    map: round(map, 1),
    mpap: round(mpap, 1),
    co: round(co, 2),
    ci: round(ci, 2),
    bsa: round(bsa, 2),
    sv: round(sv, 1),
    svi: round(svi, 1),
    svr: round(calcSvr(map, inputs.rap, co), 0),
    svri: round(calcSvri(map, inputs.rap, ci), 0),
    pvr: round(calcPvr(mpap, inputs.pcwp, co), 2),
    pvri: round(calcPvri(mpap, inputs.pcwp, ci), 2),
    tpg: round(calcTpg(mpap, inputs.pcwp), 1),
    dpg: round(calcDpg(inputs.padp, inputs.pcwp), 1),
    cpo: round(calcCpo(map, co), 2),
    papi: round(calcPapi(inputs.pasp, inputs.padp, inputs.rap), 2),
    rvswi: round(calcRvswi(mpap, inputs.rap, svi), 2),
    lvswi: round(calcLvswi(map, inputs.pcwp, svi), 2),
    cvpPcwpRatio: round(calcCvpPcwp(inputs.rap, inputs.pcwp), 2),
    fickVo2: round(fick.vo2, 1),
    fickAvO2Diff: round(fick.avO2Diff, 1),
    fickCo: round(fick.co, 2),
    fickCi: round(fick.ci, 2),
    coSource: source,
  };
}

function flagStatus(
  value: number | null,
  low: number | null,
  high: number | null,
  criticalLow?: number,
  criticalHigh?: number,
): FlagResult['status'] {
  if (!isPresent(value)) return 'unknown';
  if (criticalLow !== undefined && value < criticalLow) return 'critical';
  if (criticalHigh !== undefined && value > criticalHigh) return 'critical';
  if (isPresent(low) && value < low) return 'low';
  if (isPresent(high) && value > high) return 'high';
  return 'normal';
}

export function buildFlags(inputs: HemodynamicsInputs, d: DerivedMetrics): FlagResult[] {
  const rows: Array<Omit<FlagResult, 'status'> & { criticalLow?: number; criticalHigh?: number }> = [
    { key: 'ci', label: 'Cardiac Index', value: d.ci, unit: 'L/min/m²', normalLow: 2.5, normalHigh: 4.0, criticalLow: 1.8 },
    { key: 'cpo', label: 'Cardiac Power Output', value: d.cpo, unit: 'W', normalLow: 1.0, normalHigh: null, criticalLow: 0.6, note: 'CPO <0.6 W associated with higher mortality in CS' },
    { key: 'papi', label: 'PAPi', value: d.papi, unit: '', normalLow: 1.0, normalHigh: null, criticalLow: 0.9, note: 'PAPi <1.0 suggests RV dysfunction' },
    { key: 'svr', label: 'SVR', value: d.svr, unit: 'dyn·s·cm⁻⁵', normalLow: 800, normalHigh: 1200 },
    { key: 'pvr', label: 'PVR', value: d.pvr, unit: 'WU', normalLow: null, normalHigh: 3.0, criticalHigh: 3.0, note: 'PVR >3 WU may limit transplant candidacy' },
    { key: 'tpg', label: 'TPG', value: d.tpg, unit: 'mmHg', normalLow: null, normalHigh: 12 },
    { key: 'dpg', label: 'DPG', value: d.dpg, unit: 'mmHg', normalLow: null, normalHigh: 7, note: 'DPG ≥7 suggests combined pre/post-capillary PH' },
    { key: 'pcwp', label: 'PCWP', value: inputs.pcwp, unit: 'mmHg', normalLow: 6, normalHigh: 12, criticalHigh: 18 },
    { key: 'rap', label: 'RAP / CVP', value: inputs.rap, unit: 'mmHg', normalLow: 2, normalHigh: 6, criticalHigh: 15 },
    { key: 'map', label: 'MAP', value: d.map, unit: 'mmHg', normalLow: 65, normalHigh: 100, criticalLow: 60 },
    { key: 'mpap', label: 'mPAP', value: d.mpap, unit: 'mmHg', normalLow: null, normalHigh: 20, note: 'mPAP >20 mmHg = pulmonary hypertension' },
    { key: 'cvp_pcwp', label: 'CVP/PCWP', value: d.cvpPcwpRatio, unit: '', normalLow: null, normalHigh: 0.63, note: 'Ratio >0.63 suggests RV congestion relative to LV' },
    { key: 'rvswi', label: 'RVSWI', value: d.rvswi, unit: 'g·m/m²', normalLow: 8, normalHigh: 12, criticalLow: 5 },
    { key: 'lvswi', label: 'LVSWI', value: d.lvswi, unit: 'g·m/m²', normalLow: 45, normalHigh: 60 },
    { key: 'svi', label: 'SVI', value: d.svi, unit: 'mL/m²', normalLow: 33, normalHigh: 47 },
  ];

  return rows.map((r) => ({
    key: r.key,
    label: r.label,
    value: r.value,
    unit: r.unit,
    normalLow: r.normalLow,
    normalHigh: r.normalHigh,
    note: r.note,
    status: flagStatus(r.value, r.normalLow, r.normalHigh, r.criticalLow, r.criticalHigh),
  }));
}

/**
 * SCAI shock stage suggestion (educational heuristic — clinician must confirm).
 * Based on SCAI consensus: A at-risk, B beginning, C classic, D deteriorating, E extremis.
 */
export function suggestScai(inputs: HemodynamicsInputs, d: DerivedMetrics): ScaiAssessment {
  const rationale: string[] = [];

  if (inputs.cardiacArrest) {
    rationale.push('Cardiac arrest / extremis criteria met');
    return { suggested: 'E', rationale };
  }

  const lowCi = isPresent(d.ci) && d.ci < 2.2;
  const lowCpo = isPresent(d.cpo) && d.cpo < 0.6;
  const lowMap = isPresent(d.map) && d.map < 65;
  const highPcwp = isPresent(inputs.pcwp) && inputs.pcwp > 15;
  const hypoperfusion =
    inputs.hypoperfusion ||
    inputs.lactateElevated ||
    inputs.coldExtremities ||
    inputs.mentalStatusChange ||
    inputs.risingCreatinine ||
    inputs.risingLft;

  if (inputs.escalatingSupport && (hypoperfusion || lowCi || lowCpo)) {
    rationale.push('Escalating support with ongoing hypoperfusion / low output');
    return { suggested: 'D', rationale };
  }

  if ((inputs.hypotensive || lowMap) && hypoperfusion && (lowCi || lowCpo || highPcwp)) {
    rationale.push('Hypotension + hypoperfusion + low output / congestion');
    return { suggested: 'C', rationale };
  }

  if (hypoperfusion && (lowCi || highPcwp) && !(inputs.hypotensive || lowMap)) {
    rationale.push('Relative hypoperfusion / congestion without frank hypotension → beginning shock');
    return { suggested: 'B', rationale };
  }

  if (inputs.hypotensive || lowMap) {
    rationale.push('Hypotension present; limited hypoperfusion markers');
    return { suggested: 'B', rationale };
  }

  if (highPcwp || (isPresent(d.ci) && d.ci < 2.5)) {
    rationale.push('Hemodynamic risk markers without classic shock');
    return { suggested: 'A', rationale };
  }

  rationale.push('No clear shock markers from entered data');
  return { suggested: 'A', rationale };
}

/**
 * Congestion / phenotype: LV-dominant, RV-dominant, BiV, or mixed (vasodilated).
 */
export function assessPhenotype(inputs: HemodynamicsInputs, d: DerivedMetrics): PhenotypeAssessment {
  const rationale: string[] = [];
  const highPcwp = isPresent(inputs.pcwp) && inputs.pcwp >= 15;
  const highRap = isPresent(inputs.rap) && inputs.rap >= 10;
  const lowPapi = isPresent(d.papi) && d.papi < 1.0;
  const highRatio = isPresent(d.cvpPcwpRatio) && d.cvpPcwpRatio > 0.63;
  const lowSvr = isPresent(d.svr) && d.svr < 800;
  const lowCi = isPresent(d.ci) && d.ci < 2.2;

  if (!isPresent(inputs.pcwp) && !isPresent(inputs.rap)) {
    return { phenotype: 'Indeterminate', rationale: ['Need RAP and/or PCWP for phenotype'] };
  }

  if (lowCi && lowSvr && !highPcwp) {
    rationale.push('Low CI with low SVR → mixed / vasodilatory phenotype');
    return { phenotype: 'Mixed', rationale };
  }

  if (highPcwp && (highRap || lowPapi || highRatio)) {
    rationale.push('Elevated PCWP with RV congestion markers (↑RAP / ↓PAPi / ↑CVP:PCWP)');
    return { phenotype: 'BiV', rationale };
  }

  if ((lowPapi || highRap || highRatio) && !highPcwp) {
    rationale.push('RV congestion / dysfunction without LV filling pressure elevation');
    return { phenotype: 'RV', rationale };
  }

  if (highPcwp && !highRap && !lowPapi) {
    rationale.push('Elevated PCWP with relatively preserved RAP / PAPi → LV-dominant');
    return { phenotype: 'LV', rationale };
  }

  if (highPcwp) {
    rationale.push('Elevated PCWP; RV markers incomplete → favor LV');
    return { phenotype: 'LV', rationale };
  }

  rationale.push('No clear congestion phenotype from available inputs');
  return { phenotype: 'None', rationale };
}

/** Demo: classic cold-wet cardiogenic shock profile */
export function demoColdWetShock(): HemodynamicsInputs {
  return {
    ...emptyFromDemo(),
    rap: 14,
    pasp: 55,
    padp: 28,
    mpap: null,
    pcwp: 28,
    co: 3.2,
    ci: null,
    bsa: 1.9,
    hr: 110,
    sbp: 82,
    dbp: 54,
    map: null,
    useFick: false,
    hb: 12.5,
    sao2: 98,
    svo2: 55,
    o2Binding: DEFAULT_O2_BINDING,
    vo2Mode: 'estimated',
    vo2Constant: DEFAULT_VO2_CONSTANT,
    vo2Measured: null,
    ageYears: 65,
    sex: 'male',
    hypotensive: true,
    hypoperfusion: true,
    escalatingSupport: false,
    cardiacArrest: false,
    lactateElevated: true,
    risingCreatinine: true,
    risingLft: false,
    coldExtremities: true,
    mentalStatusChange: false,
  };
}

function emptyFromDemo(): HemodynamicsInputs {
  return {
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
  };
}
