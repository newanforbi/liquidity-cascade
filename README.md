# The Liquidity Cascade

**Live site: [newanforbi.github.io/liquidity-cascade](https://newanforbi.github.io/liquidity-cascade/)**

**Supercycle fork: [newanforbi.github.io/liquidity-cascade/supercycle](https://newanforbi.github.io/liquidity-cascade/supercycle/)**

---

## The Original Framework

A chronological matrix for capital rotation across **Solana, MicroStrategy, and Zcash** — anchored to the Bitcoin halving as the definitive temporal fulcrum.

This framework maps the three-phase liquidity cascade observed in the 2022–2025 cycle, demonstrating how capital flows through distinct asset archetypes in a repeatable sequence relative to the Bitcoin halving:

| Phase | Asset | Role | Entry | Exit | Multiple |
|-------|-------|------|-------|------|----------|
| 1 | SOL | Speculative Vanguard | Month −16 | Month −1 | 19.66x |
| 2 | MSTR | Leveraged Institutional Proxy | Month +2 | Month +7 | 3.51x |
| 3 | ZEC | Terminal Liquidity Overflow | Month +9 | Month +19 | 33.7x |

### Dashboard Sections

- **Overview** — Phase cards, halving-relative timeline, capital growth trajectory
- **Macro** — Global M2 correlation, Bitcoin halving history, BTC dominance signals
- **Phases** — Deep-dive on mechanics, entry/exit signals, and key insights for each asset
- **Calculator** — Interactive rotation simulator with adjustable capital and risk allocation
- **2028** — Projected rotation dates for the ~April 2028 halving
- **Blackpaper** — Long-form written analysis of the full framework

---

## Supercycle: Historical Proof of Concept

The **Supercycle** is a fork that validates the rotating capital rotation thesis using **historical cryptocurrency data** (October 2023 – May 2026). Instead of equity proxies, it models the same three-layer infrastructure thesis using pure crypto assets:

| Phase | Asset | Role | Entry | Exit | Multiple |
|-------|-------|------|-------|------|----------|
| 1 | TAO | AI Compute Vanguard | Oct 19, 2023 | Mar 8, 2024 | 15x |
| 2 | XRP | Institutional Settlement | Oct 2, 2024 | Jan 8, 2025 | 6x |
| 3 | ZEC W1 | Terminal Blow-Off | Apr 9, 2025 | Nov 12, 2025 | 21.6x |
| 4 | ZEC W2 | Swing Trade (Buy the Dip) | Mar 7, 2026 | May 19, 2026 | 3.4x |

**Realized return: $100K → $660.8M (6,608x) over 19 months**

The Supercycle proves:
- The rotating capital framework works across different asset classes and market conditions
- The halving-relative temporal structure is repeatable and predictable
- Disciplined capital rotation through all four phases maximizes extraction at each peak
- The swing trade on retracements (Phase 4) demonstrates the importance of psychological discipline after terminal blow-offs

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
