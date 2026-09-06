import type { TransplantEval } from '../lib/lvadTx';

export function TransplantPanel({ evalResult }: { evalResult: TransplantEval }) {
  return (
    <div className="card">
      <h2>Transplant evaluation</h2>
      <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
        Pulmonary vascular resistance / TPG / DPG snapshot for listing discussions. Institutional criteria supersede.
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
