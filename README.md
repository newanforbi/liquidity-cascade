# The Liquidity Cascade

**Live site: [newanforbi.github.io/liquidity-cascade](https://newanforbi.github.io/liquidity-cascade/)**

---

## The Original Framework

A chronological matrix for capital rotation across **Solana, MicroStrategy, and Zcash** — anchored to the Bitcoin halving as the definitive temporal fulcrum.

This framework maps the four-phase liquidity cascade observed in the 2022–2026 cycle, demonstrating how capital flows through distinct asset archetypes in a repeatable sequence relative to the Bitcoin halving:

| Phase | Asset | Role | Entry | Exit | Multiple |
|-------|-------|------|-------|------|----------|
| 1 | SOL | Speculative Vanguard | Month −16 | Month −1 | 19.66x |
| 2 | MSTR | Leveraged Institutional Proxy | Month +2 | Month +7 | 3.51x |
| 3 | ZEC (W1) | Terminal Blow-Off | Month +9 | Month +19 | 33.7x |
| 4 | ZEC (W2) | Swing Trade Retracement | Month +23 | Month +25 | 3.4x |

**Realized return: $100K → $790.7M (7,907x) over 46 months**

The original framework demonstrates:
- The rotating capital thesis works reliably across the halving cycle
- Terminal assets (ZEC) exhibit two-wave patterns: blow-off exhaustion followed by capitulation re-entry
- Disciplined cash reserves between phases enable swing trading on retracements
- The 2028 cycle is projected to follow identical mechanics (SOL → MSTR → ZEC two-wave pattern)

### Dashboard Sections

- **Overview** — Phase cards, halving-relative timeline, capital growth trajectory
- **Macro** — Global M2 correlation, Bitcoin halving history, BTC dominance signals
- **Phases** — Deep-dive on mechanics, entry/exit signals, and key insights for each asset
- **Signals** — Real-time RSI, mNAV premiums, and entry/exit thresholds across all four phases
- **Calculator** — Interactive rotation simulator showing $100K cascading through all 4 phases
- **Cycles** — Historical cycle comparison (2020, 2024, projected 2028)
- **Execution** — Pre-entry checklist and psychological discipline framework
- **Blackpaper** — Long-form written analysis of the full framework

---

## Technology Stack

- React 18
- Vite 5
- Inline styles (no CSS framework)
- Google Fonts: DM Sans, JetBrains Mono, Space Grotesk, Source Serif 4

## Local Development

```bash
npm install
npm run dev
```

## Deployment

Pushes to `main` or `master` automatically deploy to GitHub Pages via the included Actions workflow.

Enable Pages in your repo settings under **Settings → Pages → Source → GitHub Actions**.

---

> **Risk Disclosure:** This is a theoretical analysis based on historical data. Cryptocurrency investments carry extreme risk including total loss of capital. Past performance does not guarantee future results. This is not financial advice.
