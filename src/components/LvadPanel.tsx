import type { LvadEval } from '../lib/lvadTx';

export function LvadPanel({ evalResult }: { evalResult: LvadEval }) {
  return (
    <div className="card">
      <h2>LVAD evaluation</h2>
      <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
        RV-failure risk snapshot using PAPi, RAP, CVP/PCWP, PVR, RVSWI. Not a validated risk score.
      </p>
      <p style={{ fontWeight: 600 }}>{evalResult.summary}</p>
      {evalResult.items.map((item) => (
        <div className="eval-item" key={item.label}>
          <span className={`badge ${item.status}`}>{item.status}</span>
          <div>
            <strong>{item.label}</strong>
            <div style={{ color: 'var(--muted)' }}>{item.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
