import type { HemodynamicsInputs } from '../lib/types';
import { NumberField } from './NumberField';
import { ChipToggle } from './ChipToggle';

interface Props {
  inputs: HemodynamicsInputs;
  setInputs: (updater: (prev: HemodynamicsInputs) => HemodynamicsInputs) => void;
  showScaiToggles: boolean;
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

export function InputPanel({ inputs, setInputs, showScaiToggles }: Props) {
  return (
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
      <div className="grid cols-3">
        <NumberField label="CO (L/min)" value={inputs.co} onChange={setNum(setInputs, 'co')} />
        <NumberField label="CI (L/min/m², optional)" value={inputs.ci} onChange={setNum(setInputs, 'ci')} placeholder="auto" />
        <NumberField label="BSA (m²)" value={inputs.bsa} onChange={setNum(setInputs, 'bsa')} step="0.01" />
        <NumberField label="HR (bpm)" value={inputs.hr} onChange={setNum(setInputs, 'hr')} />
      </div>

      <h3>Systemic pressures</h3>
      <div className="grid cols-3">
        <NumberField label="SBP (mmHg)" value={inputs.sbp} onChange={setNum(setInputs, 'sbp')} />
        <NumberField label="DBP (mmHg)" value={inputs.dbp} onChange={setNum(setInputs, 'dbp')} />
        <NumberField label="MAP (mmHg, optional)" value={inputs.map} onChange={setNum(setInputs, 'map')} placeholder="auto" />
      </div>

      <h3>Optional Fick CO</h3>
      <div className="toggle-row" style={{ marginBottom: '0.65rem' }}>
        <ChipToggle label="Use Fick CO" checked={inputs.useFick} onChange={setBool(setInputs, 'useFick')} />
      </div>
      {inputs.useFick && (
        <div className="grid cols-3">
          <NumberField label="VO₂ (mL/min)" value={inputs.vo2} onChange={setNum(setInputs, 'vo2')} />
          <NumberField label="CaO₂ (mL/dL)" value={inputs.cao2} onChange={setNum(setInputs, 'cao2')} step="0.1" />
          <NumberField label="CvO₂ (mL/dL)" value={inputs.cvo2} onChange={setNum(setInputs, 'cvo2')} step="0.1" />
        </div>
      )}

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
  );
}
