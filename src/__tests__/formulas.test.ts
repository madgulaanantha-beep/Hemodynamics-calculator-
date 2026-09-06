import { describe, expect, it } from 'vitest';
import {
  assessPhenotype,
  buildFlags,
  calcCpo,
  calcDpg,
  calcFickCo,
  calcMap,
  calcMpap,
  calcPapi,
  calcPvr,
  calcSv,
  calcSvr,
  calcTpg,
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

  it('calculates Fick CO', () => {
    expect(calcFickCo(250, 20, 15)).toBe(5);
  });

  it('calculates SVR', () => {
    expect(calcSvr(90, 10, 5)).toBe(1280);
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
