# The Liquidity Cascade

**Live site: [newanforbi.github.io/liquidity-cascade](https://newanforbi.github.io/liquidity-cascade/)**

A chronological matrix for capital rotation across Solana, MicroStrategy, and Zcash — anchored to the Bitcoin halving as the definitive temporal fulcrum.

## Overview

This dashboard maps the three-phase liquidity cascade observed in the 2022–2025 crypto cycle, demonstrating how capital flows through distinct asset archetypes in a repeatable sequence relative to the Bitcoin halving.

| Phase | Asset | Role | Entry | Exit | Multiple |
|-------|-------|------|-------|------|----------|
| 1 | SOL | Speculative Vanguard | Month −16 | Month −1 | 19.66x |
| 2 | MSTR | Leveraged Institutional Proxy | Month +2 | Month +7 | 3.51x |
| 3 | ZEC | Terminal Liquidity Overflow | Month +9 | Month +19 | 33.7x |

## Sections

- **Overview** — Phase cards, halving-relative timeline, capital growth trajectory, and phase detail
- **Macro** — Global M2 correlation, Bitcoin halving history, BTC dominance signal, mid-cycle dilemma
- **Phases** — Deep-dive on mechanics, entry/exit signals, and key insights for each asset
- **Calculator** — Interactive rotation simulator with adjustable initial capital and risk split
- **2028** — Projected rotation dates anchored to the ~April 2028 halving
- **Blackpaper** — Long-form written analysis of the full framework

## Stack

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
