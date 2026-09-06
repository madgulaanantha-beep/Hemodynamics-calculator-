import type { DerivedMetrics, HemodynamicsInputs, ScaiStage } from './types';

export function formatSummary(
  inputs: HemodynamicsInputs,
  d: DerivedMetrics,
  scaiConfirmed: ScaiStage,
  scaiSuggested: ScaiStage,
  phenotype: string,
): string {
  const n = (v: number | null) => (v === null || v === undefined ? '—' : String(v));
  const coSrc =
    d.coSource === 'fick'
      ? 'Fick'
      : d.coSource === 'thermo'
        ? 'Thermo'
        : d.coSource === 'ci_bsa'
          ? 'CI×BSA'
          : '—';

  return [
    'HEMODYNAMICS SUMMARY (educational — not a medical device)',
    `SCAI: confirmed ${scaiConfirmed ?? '—'} (suggested ${scaiSuggested ?? '—'})`,
    `Phenotype: ${phenotype}`,
    '--- Inputs ---',
    `RAP: ${n(inputs.rap)} mmHg`,
    `PASP/PADP: ${n(inputs.pasp)} / ${n(inputs.padp)} mmHg`,
    `mPAP: ${n(d.mpap)} mmHg`,
    `PCWP: ${n(inputs.pcwp)} mmHg`,
    `CO source: ${coSrc}`,
    `CO: ${n(d.co)} L/min`,
    `CI: ${n(d.ci)} L/min/m²`,
    `BSA: ${n(d.bsa ?? inputs.bsa)} m²`,
    `HR: ${n(inputs.hr)} bpm`,
    `SBP/DBP: ${n(inputs.sbp)} / ${n(inputs.dbp)} mmHg`,
    `MAP: ${n(d.map)} mmHg`,
    '--- Indirect Fick ---',
    `Hb / SaO₂ / SvO₂: ${n(inputs.hb)} g/dL / ${n(inputs.sao2)}% / ${n(inputs.svo2)}%`,
    `VO₂ mode: ${inputs.vo2Mode}`,
    `VO₂ used: ${n(d.fickVo2)} mL/min`,
    `AV O₂ diff: ${n(d.fickAvO2Diff)} mL/L`,
    `Fick CO / CI: ${n(d.fickCo)} L/min / ${n(d.fickCi)} L/min/m²`,
    '--- Derived ---',
    `SV/SVI: ${n(d.sv)} mL / ${n(d.svi)} mL/m²`,
    `SVR/SVRI: ${n(d.svr)} / ${n(d.svri)}`,
    `PVR/PVRI: ${n(d.pvr)} WU / ${n(d.pvri)} WU·m²`,
    `TPG: ${n(d.tpg)} mmHg`,
    `DPG: ${n(d.dpg)} mmHg`,
    `CPO: ${n(d.cpo)} W`,
    `PAPi: ${n(d.papi)}`,
    `RVSWI: ${n(d.rvswi)} g·m/m²`,
    `LVSWI: ${n(d.lvswi)} g·m/m²`,
    `CVP/PCWP: ${n(d.cvpPcwpRatio)}`,
  ].join('\n');
}
