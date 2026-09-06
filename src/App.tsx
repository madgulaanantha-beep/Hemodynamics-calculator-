import { useMemo, useState } from 'react';
import { InputPanel } from './components/InputPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { ShockPanel } from './components/ShockPanel';
import { LvadPanel } from './components/LvadPanel';
import { TransplantPanel } from './components/TransplantPanel';
import {
  assessPhenotype,
  buildFlags,
  demoColdWetShock,
  deriveAll,
  suggestScai,
} from './lib/formulas';
import { evaluateLvad, evaluateTransplant } from './lib/lvadTx';
import { formatSummary } from './lib/summary';
import { emptyInputs, type AppMode, type HemodynamicsInputs, type ScaiStage } from './lib/types';
import './styles/app.css';

export default function App() {
  const [mode, setMode] = useState<AppMode>('shock');
  const [inputs, setInputs] = useState<HemodynamicsInputs>(emptyInputs);
  const [scaiConfirmed, setScaiConfirmed] = useState<ScaiStage>(null);
  const [toast, setToast] = useState<string | null>(null);

  const derived = useMemo(() => deriveAll(inputs), [inputs]);
  const flags = useMemo(() => buildFlags(inputs, derived), [inputs, derived]);
  const scai = useMemo(() => suggestScai(inputs, derived), [inputs, derived]);
  const phenotype = useMemo(() => assessPhenotype(inputs, derived), [inputs, derived]);
  const lvad = useMemo(() => evaluateLvad(inputs, derived), [inputs, derived]);
  const tx = useMemo(() => evaluateTransplant(inputs, derived), [inputs, derived]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function copySummary() {
    const text = formatSummary(
      inputs,
      derived,
      scaiConfirmed,
      scai.suggested,
      phenotype.phenotype,
    );
    try {
      await navigator.clipboard.writeText(text);
      showToast('Summary copied to clipboard');
    } catch {
      showToast('Clipboard unavailable — select text manually');
    }
  }

  function loadDemo() {
    setInputs(demoColdWetShock());
    setScaiConfirmed(null);
    setMode('shock');
    showToast('Loaded cold-wet shock demo');
  }

  function resetAll() {
    setInputs(emptyInputs());
    setScaiConfirmed(null);
    showToast('Inputs cleared');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hemodynamics Calculator</h1>
        <p className="subtitle">
          Bedside cardiogenic shock · SCAI staging · LVAD RV risk · transplant PH snapshot.
          Educational decision support — not a medical device.
        </p>
      </header>

      <nav className="mode-tabs" aria-label="Mode">
        <button type="button" className={mode === 'shock' ? 'active' : ''} onClick={() => setMode('shock')}>
          Shock / SCAI
        </button>
        <button type="button" className={mode === 'lvad' ? 'active' : ''} onClick={() => setMode('lvad')}>
          LVAD eval
        </button>
        <button type="button" className={mode === 'transplant' ? 'active' : ''} onClick={() => setMode('transplant')}>
          Transplant
        </button>
      </nav>

      <div className="toolbar">
        <button type="button" className="btn primary" onClick={loadDemo}>
          Demo: cold-wet shock
        </button>
        <button type="button" className="btn" onClick={copySummary}>
          Copy summary
        </button>
        <button type="button" className="btn ghost" onClick={resetAll}>
          Reset
        </button>
      </div>

      <InputPanel
        inputs={inputs}
        setInputs={setInputs}
        showScaiToggles={mode === 'shock'}
        derived={derived}
      />

      <ResultsPanel flags={flags} />

      {mode === 'shock' && (
        <ShockPanel
          scai={scai}
          confirmed={scaiConfirmed}
          onConfirm={setScaiConfirmed}
          phenotype={phenotype}
        />
      )}
      {mode === 'lvad' && <LvadPanel evalResult={lvad} />}
      {mode === 'transplant' && <TransplantPanel evalResult={tx} />}

      <p className="disclaimer">
        Disclaimer: This application is for education and clinician decision support only. It does not
        diagnose, treat, or replace clinical judgment, institutional protocols, or device labeling.
        Verify all calculations and SCAI / LVAD / transplant decisions with primary data and guidelines.
        No PHI should be stored in this client-side tool.
      </p>

      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}
