import type { DerivedMetrics, HemodynamicsInputs } from '../lib/types';
import { NumberField } from './NumberField';
import { ChipToggle } from './ChipToggle';
import { FickPanel } from './FickPanel';

interface Props {
  inputs: HemodynamicsInputs;
  setInputs: (updater: (prev: HemodynamicsInputs) => HemodynamicsInputs) => void;
  showScaiToggles: boolean;
  derived: DerivedMetrics;
}

function setNum(
  setInputs: Props['setInputs'],
  key: keyof HemodynamicsInputs,
) {
  return (v: number | null) => setInputs((p) => ({ ...p, [key]: v }));
}

function setBool(
  setInputs: Props['setInputs'],
  key: keyof HemodynamicsInputs,
) {
  return (v: boolean) => setInputs((p) => ({ ...p, [key]: v }));
}

export function InputPanel({ inputs, setInputs, showScaiToggles, derived }: Props) {
  return (
    <>
      <div className="card">
        <h2>Shared hemodynamics inputs</h2>

        <h3>Right heart / PA catheter</h3>
        <div className="grid cols-3">
          <NumberField label="RAP / CVP (mmHg)" value={inputs.rap} onChange={setNum(setInputs, 'rap')} />
          <NumberField label="PASP (mmHg)" value={inputs.pasp} onChange={setNum(setInputs, 'pasp')} />
          <NumberField label="PADP (mmHg)" value={inputs.padp} onChange={setNum(setInputs, 'padp')} />
          <NumberField label="mPAP (mmHg, optional)" value={inputs.mpap} onChange={setNum(setInputs, 'mpap')} placeholder="auto" />
          <NumberField label="PCWP (mmHg)" value={inputs.pcwp} onChange={setNum(setInputs, 'pcwp')} />
        </div>

        <h3>Flow / anthropometrics</h3>
        <p className="hint" style={{ marginTop: 0 }}>
          Thermodilution / entered CO used when Fick source is off. BSA also feeds Fick VO₂ estimates.
        </p>
        <div className="grid cols-3">
          <NumberField label="CO thermo (L/min)" value={inputs.co} onChange={setNum(setInputs, 'co')} />
          <NumberField label="CI (L/min/m², optional)" value={inputs.ci} onChange={setNum(setInputs, 'ci')} placeholder="auto" />
          <NumberField label="BSA (m²)" value={inputs.bsa} onChange={setNum(setInputs, 'bsa')} step="0.01" />
          <NumberField label="HR (bpm)" value={inputs.hr} onChange={setNum(setInputs, 'hr')} />
        </div>
        {derived.coSource && (
          <p className="hint">
            Active CO source:{' '}
            <strong>
              {derived.coSource === 'fick'
                ? 'Indirect Fick'
                : derived.coSource === 'thermo'
                  ? 'Thermo / entered'
                  : 'CI × BSA'}
            </strong>
            {derived.co != null ? ` → ${derived.co} L/min` : ''}
            {derived.ci != null ? ` (CI ${derived.ci})` : ''}
          </p>
        )}

        <h3>Systemic pressures</h3>
        <div className="grid cols-3">
          <NumberField label="SBP (mmHg)" value={inputs.sbp} onChange={setNum(setInputs, 'sbp')} />
          <NumberField label="DBP (mmHg)" value={inputs.dbp} onChange={setNum(setInputs, 'dbp')} />
          <NumberField label="MAP (mmHg, optional)" value={inputs.map} onChange={setNum(setInputs, 'map')} placeholder="auto" />
        </div>

        {showScaiToggles && (
          <>
            <h3>SCAI clinical markers</h3>
            <div className="toggle-row">
              <ChipToggle label="Hypotensive" checked={inputs.hypotensive} onChange={setBool(setInputs, 'hypotensive')} />
              <ChipToggle label="Hypoperfusion" checked={inputs.hypoperfusion} onChange={setBool(setInputs, 'hypoperfusion')} />
              <ChipToggle label="Escalating support" checked={inputs.escalatingSupport} onChange={setBool(setInputs, 'escalatingSupport')} />
              <ChipToggle label="Cardiac arrest" checked={inputs.cardiacArrest} onChange={setBool(setInputs, 'cardiacArrest')} />
              <ChipToggle label="↑ Lactate" checked={inputs.lactateElevated} onChange={setBool(setInputs, 'lactateElevated')} />
              <ChipToggle label="↑ Creatinine" checked={inputs.risingCreatinine} onChange={setBool(setInputs, 'risingCreatinine')} />
              <ChipToggle label="↑ LFTs" checked={inputs.risingLft} onChange={setBool(setInputs, 'risingLft')} />
              <ChipToggle label="Cold extremities" checked={inputs.coldExtremities} onChange={setBool(setInputs, 'coldExtremities')} />
              <ChipToggle label="Mental status Δ" checked={inputs.mentalStatusChange} onChange={setBool(setInputs, 'mentalStatusChange')} />
            </div>
          </>
        )}
      </div>

      <FickPanel inputs={inputs} setInputs={setInputs} derived={derived} />
    </>
  );
}
