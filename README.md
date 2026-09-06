# Hemodynamics Calculator

Mobile-first bedside **cardiogenic shock hemodynamics** web app with three modes that share the same inputs:

1. **Shock / SCAI** — derived pressures and flows, SCAI A–E suggestion plus clinician confirm, LV/RV/BiV/mixed phenotype
2. **LVAD eval** — RV-failure risk snapshot (PAPi, RAP, CVP/PCWP, PVR, RVSWI)
3. **Transplant eval** — PVR / TPG / DPG pulmonary vascular snapshot

> Educational decision support only — **not a medical device**. Verify all values clinically.

## Quick start

```bash
npm install
npm run dev
npm test
npm run build
```

Open the URL Vite prints (usually http://localhost:5173).

## Inputs

| Input | Notes |
|-------|--------|
| RAP / CVP | mmHg |
| PASP / PADP | mmHg; mPAP optional (auto from PASP/PADP) |
| PCWP | mmHg |
| CO / CI | L/min or L/min/m²; either + BSA resolves the other |
| BSA | m² |
| HR | bpm (for SV / SVI) |
| SBP / DBP | MAP optional (auto) |
| Fick (optional) | VO₂, CaO₂, CvO₂ |
| SCAI toggles | hypotension, hypoperfusion, escalating support, arrest, lactate, organs, cold extremities, mentation |

## Key formulas

| Metric | Formula |
|--------|---------|
| MAP | DBP + (SBP − DBP) / 3 |
| mPAP | PADP + (PASP − PADP) / 3 |
| CI | CO / BSA |
| SV | (CO × 1000) / HR |
| SVI | SV / BSA |
| SVR | 80 × (MAP − RAP) / CO (dyn·s·cm⁻⁵) |
| SVRI | 80 × (MAP − RAP) / CI |
| PVR | (mPAP − PCWP) / CO (Wood units) |
| PVRI | (mPAP − PCWP) / CI |
| TPG | mPAP − PCWP |
| DPG | PADP − PCWP |
| CPO | (MAP × CO) / 451 (Watts) |
| PAPi | (PASP − PADP) / RAP |
| RVSWI | (mPAP − RAP) × SVI × 0.0136 |
| LVSWI | (MAP − PCWP) × SVI × 0.0136 |
| CVP/PCWP | RAP / PCWP |
| Fick CO | VO₂ / ((CaO₂ − CvO₂) × 10) |

### Selected normal / flag ranges (educational)

- CI: ~2.5–4.0 L/min/m² (critical often less than 1.8–2.2 in shock literature)
- CPO: concern when less than 0.6 W in cardiogenic shock
- PAPi: RV dysfunction concern when less than 1.0 (context-dependent)
- PVR: transplant discussions often focus on greater than 3 WU and reversibility
- DPG ≥7 mmHg: combined pre/post-capillary PH signal
- CVP/PCWP greater than 0.63: relative RV congestion

SCAI staging and phenotype logic are **heuristics** for teaching; always confirm at the bedside.

## Features

- Dark clinical UI, mobile-first
- Demo **cold-wet shock** profile button
- **Copy summary** to clipboard
- Client-side only (no PHI storage)
- Vitest unit tests for core formulas

## Stack

React 18 + TypeScript + Vite + Vitest

## License

For clinical education use by the repository owner. Not for commercial device claims.
