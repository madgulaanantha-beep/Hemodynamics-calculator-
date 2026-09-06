import type {
  DerivedMetrics,
  FlagResult,
  HemodynamicsInputs,
  PhenotypeAssessment,
  ScaiAssessment,
} from './types';

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

/** Fick CO = VO2 / ((CaO2 − CvO2) × 10) when contents in mL O2/dL; VO2 in mL/min → L/min */
export function calcFickCo(vo2: number | null, cao2: number | null, cvo2: number | null): number | null {
  if (!isPresent(vo2) || !isPresent(cao2) || !isPresent(cvo2)) return null;
  const avDiff = cao2 - cvo2;
  if (avDiff <= 0) return null;
  return vo2 / (avDiff * 10);
}

/** Resolve CO from direct entry, CI×BSA, or Fick. */
export function resolveCo(inputs: HemodynamicsInputs): number | null {
  if (inputs.useFick) {
    const fick = calcFickCo(inputs.vo2, inputs.cao2, inputs.cvo2);
    if (isPresent(fick)) return fick;
  }
  if (isPresent(inputs.co)) return inputs.co;
  if (isPresent(inputs.ci) && isPresent(inputs.bsa) && inputs.bsa > 0) {
    return inputs.ci * inputs.bsa;
  }
  return null;
}

/** Resolve CI from direct entry or CO/BSA. */
export function resolveCi(inputs: HemodynamicsInputs, co: number | null): number | null {
  if (isPresent(inputs.ci)) return inputs.ci;
  if (isPresent(co) && isPresent(inputs.bsa) && inputs.bsa > 0) return co / inputs.bsa;
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
  const co = resolveCo(inputs);
  const ci = resolveCi(inputs, co);
  const sv = calcSv(co, inputs.hr);
  const svi = calcSvi(sv, inputs.bsa);

  return {
    map: round(map, 1),
    mpap: round(mpap, 1),
    co: round(co, 2),
    ci: round(ci, 2),
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
    vo2: null,
    cao2: null,
    cvo2: null,
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
  };
}
