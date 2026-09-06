import { describe, expect, it } from 'vitest';
import {
  assessPhenotype,
  buildFlags,
  calcAvO2DiffMlPerL,
  calcBsaMosteller,
  calcCpo,
  calcDpg,
  calcFickCo,
  calcIndirectFickCo,
  calcMap,
  calcMpap,
  calcPapi,
  calcPvr,
  calcSv,
  calcSvr,
  calcTpg,
  calcVo2Estimated,
  calcVo2LaFarge,
  computeIndirectFick,
  demoColdWetShock,
  deriveAll,
  suggestScai,
} from '../lib/formulas';
import { emptyInputs } from '../lib/types';

describe('pressure averages', () => {
  it('calculates MAP from SBP/DBP', () => {
    expect(calcMap(120, 80, null)).toBeCloseTo(93.333, 2);
  });
  it('prefers MAP override', () => {
    expect(calcMap(120, 80, 70)).toBe(70);
  });
  it('calculates mPAP from PASP/PADP', () => {
    expect(calcMpap(40, 20, null)).toBeCloseTo(26.666, 2);
  });
});

describe('flow metrics', () => {
  it('calculates SV', () => {
    expect(calcSv(5, 100)).toBe(50);
  });
  it('calculates legacy Fick CO from contents in mL/dL', () => {
    expect(calcFickCo(250, 20, 15)).toBe(5);
  });
  it('calculates SVR', () => {
    expect(calcSvr(90, 10, 5)).toBe(1280);
  });
});

describe('indirect Fick formulas', () => {
  it('computes Mosteller BSA', () => {
    expect(calcBsaMosteller(170, 70)).toBeCloseTo(1.818, 3);
  });
  it('computes AV O2 diff in mL/L', () => {
    expect(calcAvO2DiffMlPerL(15, 98, 68, 1.36)).toBeCloseTo(61.2, 5);
  });
  it('matches 1.34 form when binding overridden', () => {
    expect(calcAvO2DiffMlPerL(10, 95, 45, 1.34)).toBeCloseTo(67, 5);
  });
  it('estimates Dehmer VO2 = 125 x BSA', () => {
    expect(calcVo2Estimated(2.0, 125)).toBe(250);
  });
  it('allows VO2 constant override', () => {
    expect(calcVo2Estimated(2.0, 110)).toBe(220);
  });
  it('computes LaFarge VO2 for adult male', () => {
    const expected = (138.1 - 11.49 * Math.log(40) + 0.378 * 80) * 1.8;
    expect(calcVo2LaFarge(1.8, 40, 80, 'male')).toBeCloseTo(expected, 5);
  });
  it('indirect Fick CO = VO2 / AV diff (mL/L)', () => {
    expect(calcIndirectFickCo(250, 50)).toBe(5);
  });
  it('end-to-end estimated VO2 yields Fick CO/CI', () => {
    const inputs = {
      ...emptyInputs(),
      bsa: 2.0,
      hb: 15,
      sao2: 98,
      svo2: 68,
      o2Binding: 1.36,
      vo2Mode: 'estimated' as const,
      vo2Constant: 125,
      useFick: true,
    };
    const fick = computeIndirectFick(inputs);
    expect(fick.vo2).toBe(250);
    expect(fick.avO2Diff).toBeCloseTo(61.2, 5);
    expect(fick.co).toBeCloseTo(250 / 61.2, 5);
    expect(fick.ci).toBeCloseTo(fick.co! / 2.0, 5);
    const d = deriveAll(inputs);
    expect(d.coSource).toBe('fick');
    expect(d.co).toBeCloseTo(4.08, 2);
    expect(d.fickCo).toBeCloseTo(4.08, 2);
    expect(d.ci).toBeCloseTo(2.04, 2);
  });
  it('measured VO2 mode', () => {
    const inputs = {
      ...emptyInputs(),
      bsa: 1.8,
      hb: 12,
      sao2: 97,
      svo2: 57,
      vo2Mode: 'measured' as const,
      vo2Measured: 220,
      useFick: true,
    };
    const fick = computeIndirectFick(inputs);
    expect(fick.vo2).toBe(220);
    expect(fick.avO2Diff).toBeCloseTo(65.28, 2);
    expect(fick.co).toBeCloseTo(220 / 65.28, 5);
  });
  it('Use Fick drives SVR from Fick CO not thermo CO', () => {
    const inputs = {
      ...emptyInputs(),
      co: 5.0,
      bsa: 2.0,
      hb: 15,
      sao2: 98,
      svo2: 68,
      vo2Mode: 'estimated' as const,
      vo2Constant: 125,
      useFick: true,
      map: 90,
      rap: 10,
      sbp: 120,
      dbp: 75,
    };
    const d = deriveAll(inputs);
    expect(d.coSource).toBe('fick');
    expect(d.co).not.toBe(5);
    expect(d.svr).toBeGreaterThan(1500);
    expect(d.svr).toBeLessThan(1600);
    expect(d.svr).not.toBe(1280);
  });
  it('thermo CO used when Use Fick is off', () => {
    const inputs = {
      ...emptyInputs(),
      co: 5.0,
      bsa: 2.0,
      hb: 15,
      sao2: 98,
      svo2: 68,
      useFick: false,
    };
    const d = deriveAll(inputs);
    expect(d.coSource).toBe('thermo');
    expect(d.co).toBe(5);
    expect(d.fickCo).not.toBeNull();
  });
});

describe('pulmonary metrics', () => {
  it('calculates PVR in Wood units', () => {
    expect(calcPvr(30, 15, 5)).toBe(3);
  });
  it('calculates TPG and DPG', () => {
    expect(calcTpg(30, 15)).toBe(15);
    expect(calcDpg(22, 15)).toBe(7);
  });
  it('calculates PAPi', () => {
    expect(calcPapi(40, 20, 10)).toBe(2);
  });
});

describe('CPO', () => {
  it('matches (MAP*CO)/451', () => {
    expect(calcCpo(90, 5)).toBeCloseTo(0.998, 2);
  });
});

describe('deriveAll + demo', () => {
  it('derives CI from CO/BSA for cold-wet demo', () => {
    const d = deriveAll(demoColdWetShock());
    expect(d.ci).toBeCloseTo(3.2 / 1.9, 2);
    expect(d.cpo).not.toBeNull();
    expect(d.papi).toBeCloseTo((55 - 28) / 14, 2);
  });
  it('suggests classic shock for demo profile', () => {
    const inputs = demoColdWetShock();
    const d = deriveAll(inputs);
    const scai = suggestScai(inputs, d);
    expect(['C', 'D', 'E']).toContain(scai.suggested);
  });
  it('flags BiV or LV phenotype for wet demo', () => {
    const inputs = demoColdWetShock();
    const d = deriveAll(inputs);
    const p = assessPhenotype(inputs, d);
    expect(['LV', 'BiV', 'RV']).toContain(p.phenotype);
  });
  it('builds flags with CI critical when very low', () => {
    const inputs = { ...emptyInputs(), co: 2.0, bsa: 2.0, sbp: 70, dbp: 40, rap: 5 };
    const d = deriveAll(inputs);
    const flags = buildFlags(inputs, d);
    const ci = flags.find((f) => f.key === 'ci');
    expect(ci?.status).toBe('critical');
  });
});
