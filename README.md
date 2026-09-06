# Hemodynamics Calculator

Mobile-first bedside **cardiogenic shock hemodynamics** web app with three modes that share the same inputs:

1. **Shock / SCAI** — derived pressures and flows, SCAI A–E suggestion plus clinician confirm, LV/RV/BiV/mixed phenotype, **indirect Fick CO**
2. **LVAD eval** — RV-failure risk snapshot (PAPi, RAP, CVP/PCWP, PVR, RVSWI)
3. **Transplant eval** — PVR / TPG / DPG pulmonary vascular snapshot

> Educational decision support only — **not a medical device**. Verify all values clinically.

**Live:** https://madgulaanantha-beep.github.io/Hemodynamics-calculator-/

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
| **Indirect Fick** | Hb, SaO₂%, SvO₂%, VO₂ mode; toggle Use Fick CO |
| SCAI toggles | hypotension, hypoperfusion, escalating support, arrest, lactate, organs, cold extremities, mentation |


## Indirect Fick (exact formula used)

CO (L/min) = VO2 (mL/min) / AV O2 diff (mL O2 / L blood)

AV O2 diff (mL/L) = Hb (g/dL) * 1.36 * (SaO2% - SvO2%) / 10

- Sa/Sv as percentages. Default Hufner 1.36 (editable; labs may use 1.34).
- Estimated VO2 (Dehmer): k * BSA, default k = 125 (override 110-150).
- Measured VO2: enter mL/min.
- LaFarge: (138.1 - a*ln(age) + 0.378*HR) * BSA (a=11.49 male / 17.04 female).
- Toggle Use Fick CO so SVR/PVR/CPO use Fick. No drug dosing.

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
| Indirect Fick CO | VO₂ / (Hb × 1.36 × (Sa% − Sv%) / 10) |

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
- Indirect Fick panel with thermo vs Fick CO toggle
- Vitest unit tests for core formulas (including Fick)

## Stack

React 18 + TypeScript + Vite + Vitest

## License

For clinical education use by the repository owner. Not for commercial device claims.
