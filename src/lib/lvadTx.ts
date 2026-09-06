import type { DerivedMetrics, HemodynamicsInputs } from './types';
import { isPresent } from './formulas';

export interface LvadEval {
  items: Array<{ label: string; status: 'ok' | 'caution' | 'concern' | 'unknown'; detail: string }>;
  summary: string;
}

export interface TransplantEval {
  items: Array<{ label: string; status: 'ok' | 'caution' | 'concern' | 'unknown'; detail: string }>;
  summary: string;
}

/**
 * LVAD evaluation heuristics (educational): RV risk, congestion, PVR, PAPi, RAP.
 * Not a substitute for institutional protocols (e.g., EUROMACS-RHF, Michigan RV risk).
 */
export function evaluateLvad(inputs: HemodynamicsInputs, d: DerivedMetrics): LvadEval {
  const items: LvadEval['items'] = [];

  if (isPresent(d.papi)) {
    if (d.papi < 1.0) {
      items.push({
        label: 'PAPi',
        status: 'concern',
        detail: `PAPi ${d.papi} — elevated risk of post-LVAD RV failure`,
      });
    } else if (d.papi < 1.5) {
      items.push({
        label: 'PAPi',
        status: 'caution',
        detail: `PAPi ${d.papi} — intermediate RV risk; optimize before implant`,
      });
    } else {
      items.push({ label: 'PAPi', status: 'ok', detail: `PAPi ${d.papi} — more favorable RV reserve` });
    }
  } else {
    items.push({ label: 'PAPi', status: 'unknown', detail: 'Enter PASP, PADP, RAP to compute PAPi' });
  }

  if (isPresent(inputs.rap)) {
    if (inputs.rap > 15) {
      items.push({ label: 'RAP', status: 'concern', detail: `RAP ${inputs.rap} mmHg — significant RV congestion` });
    } else if (inputs.rap > 10) {
      items.push({ label: 'RAP', status: 'caution', detail: `RAP ${inputs.rap} mmHg — optimize volume / RV` });
    } else {
      items.push({ label: 'RAP', status: 'ok', detail: `RAP ${inputs.rap} mmHg` });
    }
  }

  if (isPresent(d.cvpPcwpRatio)) {
    if (d.cvpPcwpRatio > 0.63) {
      items.push({
        label: 'CVP/PCWP',
        status: 'caution',
        detail: `Ratio ${d.cvpPcwpRatio} (>0.63) — RV:LV congestion imbalance`,
      });
    } else {
      items.push({ label: 'CVP/PCWP', status: 'ok', detail: `Ratio ${d.cvpPcwpRatio}` });
    }
  }

  if (isPresent(d.pvr)) {
    if (d.pvr > 5) {
      items.push({ label: 'PVR', status: 'caution', detail: `PVR ${d.pvr} WU — consider PH therapy / reassess` });
    } else {
      items.push({ label: 'PVR', status: 'ok', detail: `PVR ${d.pvr} WU` });
    }
  }

  if (isPresent(d.rvswi)) {
    if (d.rvswi < 5) {
      items.push({ label: 'RVSWI', status: 'concern', detail: `RVSWI ${d.rvswi} — poor RV stroke work` });
    } else if (d.rvswi < 8) {
      items.push({ label: 'RVSWI', status: 'caution', detail: `RVSWI ${d.rvswi} — borderline RV performance` });
    } else {
      items.push({ label: 'RVSWI', status: 'ok', detail: `RVSWI ${d.rvswi}` });
    }
  }

  if (isPresent(inputs.pcwp) && inputs.pcwp > 25) {
    items.push({
      label: 'PCWP',
      status: 'caution',
      detail: `PCWP ${inputs.pcwp} mmHg — severe left-sided congestion; bridge/optimize`,
    });
  }

  const concerns = items.filter((i) => i.status === 'concern').length;
  const cautions = items.filter((i) => i.status === 'caution').length;
  let summary = 'Insufficient data for LVAD RV-risk snapshot.';
  if (items.some((i) => i.status !== 'unknown')) {
    if (concerns > 0) summary = `LVAD RV-risk: ${concerns} concern(s), ${cautions} caution(s) — multidisciplinary review.`;
    else if (cautions > 0) summary = `LVAD RV-risk: ${cautions} caution(s) — optimize and reassess.`;
    else summary = 'LVAD RV-risk markers within more favorable ranges (educational only).';
  }

  return { items, summary };
}

/**
 * Transplant evaluation: PVR, TPG, DPG, reversibility cues (educational).
 * Institutional listing criteria always supersede this tool.
 */
export function evaluateTransplant(_inputs: HemodynamicsInputs, d: DerivedMetrics): TransplantEval {
  const items: TransplantEval['items'] = [];

  if (isPresent(d.pvr)) {
    if (d.pvr > 5) {
      items.push({
        label: 'PVR',
        status: 'concern',
        detail: `PVR ${d.pvr} WU — often prohibitive without demonstrated reversibility`,
      });
    } else if (d.pvr > 3) {
      items.push({
        label: 'PVR',
        status: 'caution',
        detail: `PVR ${d.pvr} WU — elevated; vasodilator challenge / continue PH therapy`,
      });
    } else {
      items.push({ label: 'PVR', status: 'ok', detail: `PVR ${d.pvr} WU — generally acceptable range` });
    }
  } else {
    items.push({ label: 'PVR', status: 'unknown', detail: 'Need mPAP, PCWP, CO for PVR' });
  }

  if (isPresent(d.tpg)) {
    if (d.tpg > 15) {
      items.push({ label: 'TPG', status: 'caution', detail: `TPG ${d.tpg} mmHg — elevated transpulmonary gradient` });
    } else {
      items.push({ label: 'TPG', status: 'ok', detail: `TPG ${d.tpg} mmHg` });
    }
  }

  if (isPresent(d.dpg)) {
    if (d.dpg >= 7) {
      items.push({
        label: 'DPG',
        status: 'caution',
        detail: `DPG ${d.dpg} mmHg — suggests combined pre- and post-capillary PH`,
      });
    } else {
      items.push({ label: 'DPG', status: 'ok', detail: `DPG ${d.dpg} mmHg` });
    }
  }

  if (isPresent(d.mpap)) {
    if (d.mpap > 25) {
      items.push({ label: 'mPAP', status: 'caution', detail: `mPAP ${d.mpap} mmHg — pulmonary hypertension` });
    } else {
      items.push({ label: 'mPAP', status: 'ok', detail: `mPAP ${d.mpap} mmHg` });
    }
  }

  if (isPresent(d.ci) && d.ci < 2.0) {
    items.push({
      label: 'CI',
      status: 'caution',
      detail: `CI ${d.ci} — low output; supports advanced therapy evaluation`,
    });
  }

  const concerns = items.filter((i) => i.status === 'concern').length;
  const cautions = items.filter((i) => i.status === 'caution').length;
  let summary = 'Insufficient data for transplant PH / candidacy snapshot.';
  if (items.some((i) => i.status !== 'unknown')) {
    if (concerns > 0) summary = `Tx eval: ${concerns} concern(s) — PH may limit candidacy pending reversibility.`;
    else if (cautions > 0) summary = `Tx eval: ${cautions} caution(s) — review PH profile and guidelines.`;
    else summary = 'Tx PH markers in more favorable ranges (educational only).';
  }

  return { items, summary };
}
