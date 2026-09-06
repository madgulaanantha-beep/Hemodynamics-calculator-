import type { PhenotypeAssessment, ScaiAssessment, ScaiStage } from '../lib/types';

const STAGES: ScaiStage[] = ['A', 'B', 'C', 'D', 'E'];

interface Props {
  scai: ScaiAssessment;
  confirmed: ScaiStage;
  onConfirm: (s: ScaiStage) => void;
  phenotype: PhenotypeAssessment;
}

export function ShockPanel({ scai, confirmed, onConfirm, phenotype }: Props) {
  return (
    <div className="card">
      <h2>Shock / SCAI staging</h2>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem' }}>
        Suggested stage <strong style={{ color: 'var(--info)' }}>{scai.suggested ?? '—'}</strong>.
        Confirm clinically — suggestion is educational only.
      </p>
      <div className="scai-row">
        {STAGES.map((s) => (
          <button
            key={s!}
            type="button"
            className={`scai-btn${scai.suggested === s ? ' suggested' : ''}${confirmed === s ? ' confirmed' : ''}`}
            onClick={() => onConfirm(s)}
            title={`Confirm SCAI ${s}`}
          >
            {s}
          </button>
        ))}
      </div>
      <ul className="list">
        {scai.rationale.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      <h3>Congestion phenotype</h3>
      <p style={{ margin: '0.25rem 0', fontSize: '1rem' }}>
        <strong>{phenotype.phenotype}</strong>
      </p>
      <ul className="list">
        {phenotype.rationale.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
