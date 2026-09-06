import type { DerivedMetrics, HemodynamicsInputs, Sex, Vo2Mode } from '../lib/types';
import { DEFAULT_O2_BINDING, DEFAULT_VO2_CONSTANT } from '../lib/types';
import { NumberField } from './NumberField';
import { ChipToggle } from './ChipToggle';

interface Props {
  inputs: HemodynamicsInputs;
  setInputs: (updater: (prev: HemodynamicsInputs) => HemodynamicsInputs) => void;
  derived: DerivedMetrics;
}

function setNum(setInputs: Props['setInputs'], key: keyof HemodynamicsInputs) {
  return (v: number | null) => setInputs((p) => ({ ...p, [key]: v }));
}

const FORMULA_HELP = `Indirect Fick cardiac output

CO (L/min) = VO₂ (mL/min) ÷ [CaO₂ − CvO₂] (mL O₂ / L blood)

AV O₂ difference (mL/L) = Hb (g/dL) × 1.36 × (SaO₂% − SvO₂%) / 10
  • Sa/Sv entered as percentages (0–100)
  • Hufner constant default 1.36 mL O₂/g Hb (editable; some labs use 1.34)
  • Dissolved O₂ ignored (bedside form)

VO₂ options:
  • Estimated (Dehmer): VO₂ = k × BSA, default k = 125 mL/min/m² (override 110–150)
  • Measured: enter VO₂ directly (mL/min)
  • LaFarge: (138.1 − a×ln(age) + 0.378×HR) × BSA
    (a = 11.49 male / 17.04 female)

Enable “Use Fick CO” to drive SVR/PVR/CPO and other derived metrics from Fick instead of thermodilution CO.`;

export function FickPanel({ inputs, setInputs, derived }: Props) {
  const vo2Mode = inputs.vo2Mode ?? 'estimated';

  function setVo2Mode(mode: Vo2Mode) {
    setInputs((p) => ({ ...p, vo2Mode: mode }));
  }

  function setSex(sex: Sex | null) {
    setInputs((p) => ({ ...p, sex }));
  }

  const n = (v: number | null) => (v === null || v === undefined ? '—' : String(v));

  return (
    <div className="card fick-card">
      <div className="fick-header">
        <h2>Indirect Fick</h2>
        <details className="formula-help">
          <summary>Formula help</summary>
          <pre className="formula-pre">{FORMULA_HELP}</pre>
        </details>
      </div>

      <p className="fick-blurb">
        CO = VO₂ / [Hb × 1.36 × (SaO₂% − SvO₂%) / 10]. Toggle source below to use Fick CO for
        SVR / PVR / CPO and the rest of the calculator.
      </p>

      <div className="toggle-row" style={{ marginBottom: '0.65rem' }}>
        <ChipToggle
          label={inputs.useFick ? 'CO source: Fick' : 'CO source: Thermo / entered'}
          checked={inputs.useFick}
          onChange={(v) => setInputs((p) => ({ ...p, useFick: v }))}
        />
      </div>

      <h3>Oxygen content inputs</h3>
      <div className="grid cols-3">
        <NumberField label="Hb (g/dL)" value={inputs.hb} onChange={setNum(setInputs, 'hb')} step="0.1" />
        <NumberField label="SaO₂ (%)" value={inputs.sao2} onChange={setNum(setInputs, 'sao2')} step="0.1" />
        <NumberField label="SvO₂ (%)" value={inputs.svo2} onChange={setNum(setInputs, 'svo2')} step="0.1" />
        <NumberField
          label="O₂ binding (mL/g)"
          value={inputs.o2Binding ?? DEFAULT_O2_BINDING}
          onChange={setNum(setInputs, 'o2Binding')}
          step="0.01"
          placeholder="1.36"
        />
      </div>

      <h3>Body size</h3>
      <div className="grid cols-3">
        <NumberField label="BSA (m²)" value={inputs.bsa} onChange={setNum(setInputs, 'bsa')} step="0.01" />
        <NumberField
          label="Height (cm, optional)"
          value={inputs.heightCm}
          onChange={setNum(setInputs, 'heightCm')}
          step="0.1"
          placeholder="Mosteller"
        />
        <NumberField
          label="Weight (kg, optional)"
          value={inputs.weightKg}
          onChange={setNum(setInputs, 'weightKg')}
          step="0.1"
          placeholder="Mosteller"
        />
      </div>
      {derived.bsa != null && (
        <p className="hint">Resolved BSA: {derived.bsa} m² (direct entry preferred over Mosteller).</p>
      )}

      <h3>VO₂ mode</h3>
      <div className="toggle-row" style={{ marginBottom: '0.65rem' }}>
        <button
          type="button"
          className={`chip ${vo2Mode === 'estimated' ? 'on' : ''}`}
          onClick={() => setVo2Mode('estimated')}
        >
          Estimated (Dehmer)
        </button>
        <button
          type="button"
          className={`chip ${vo2Mode === 'measured' ? 'on' : ''}`}
          onClick={() => setVo2Mode('measured')}
        >
          Measured VO₂
        </button>
        <button
          type="button"
          className={`chip ${vo2Mode === 'lafarge' ? 'on' : ''}`}
          onClick={() => setVo2Mode('lafarge')}
        >
          LaFarge
        </button>
      </div>

      {vo2Mode === 'estimated' && (
        <div className="grid cols-3">
          <NumberField
            label="VO₂ constant (mL/min/m²)"
            value={inputs.vo2Constant ?? DEFAULT_VO2_CONSTANT}
            onChange={setNum(setInputs, 'vo2Constant')}
            step="1"
            placeholder="125"
          />
        </div>
      )}

      {vo2Mode === 'measured' && (
        <div className="grid cols-3">
          <NumberField
            label="Measured VO₂ (mL/min)"
            value={inputs.vo2Measured}
            onChange={setNum(setInputs, 'vo2Measured')}
            step="1"
          />
        </div>
      )}

      {vo2Mode === 'lafarge' && (
        <>
          <div className="grid cols-3">
            <NumberField label="Age (years)" value={inputs.ageYears} onChange={setNum(setInputs, 'ageYears')} step="1" />
            <NumberField label="HR (bpm)" value={inputs.hr} onChange={setNum(setInputs, 'hr')} step="1" />
          </div>
          <div className="toggle-row" style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className={`chip ${inputs.sex === 'male' ? 'on' : ''}`}
              onClick={() => setSex('male')}
            >
              Male
            </button>
            <button
              type="button"
              className={`chip ${inputs.sex === 'female' ? 'on' : ''}`}
              onClick={() => setSex('female')}
            >
              Female
            </button>
          </div>
        </>
      )}

      <h3>Fick results</h3>
      <div className="metric-grid">
        <div className="metric">
          <div className="label">VO₂ used</div>
          <div className="value">{n(derived.fickVo2)} <span className="unit">mL/min</span></div>
        </div>
        <div className="metric">
          <div className="label">AV O₂ diff</div>
          <div className="value">{n(derived.fickAvO2Diff)} <span className="unit">mL/L</span></div>
        </div>
        <div className="metric">
          <div className="label">Fick CO</div>
          <div className="value">{n(derived.fickCo)} <span className="unit">L/min</span></div>
        </div>
        <div className="metric">
          <div className="label">Fick CI</div>
          <div className="value">{n(derived.fickCi)} <span className="unit">L/min/m²</span></div>
        </div>
      </div>
      {inputs.useFick && derived.coSource === 'fick' && (
        <p className="hint ok-hint">Using Fick CO for derived SVR / PVR / CPO / SV / etc.</p>
      )}
      {inputs.useFick && derived.coSource !== 'fick' && (
        <p className="hint warn-hint">Use Fick is on, but Fick CO is incomplete — enter Hb, SaO₂, SvO₂, and VO₂/BSA.</p>
      )}
    </div>
  );
}
