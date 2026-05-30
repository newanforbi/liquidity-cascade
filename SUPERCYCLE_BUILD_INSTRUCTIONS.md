# Supercycle: Build & Deployment Instructions

**Version:** 1.0  
**Last Updated:** May 2026  
**Project:** AI Compute + Payments + Privacy supercycle capital rotation model

---

## Executive Summary

Supercycle is a **historical proof-of-concept dashboard** validating the rotating capital rotation thesis across cryptocurrency infrastructure layers using actual 2023–2026 price data. It demonstrates $100K → $660.8M (6,608x return) over 19 months through four distinct phases:

| Phase | Asset | Entry | Exit | Multiple | Timeline |
|-------|-------|-------|------|----------|----------|
| 1 | TAO | Oct 19, 2023 @ $46.44 | Mar 8, 2024 @ $699.94 | 15x | 4.5 months |
| 2 | XRP | Oct 2, 2024 @ $0.5241 | Jan 8, 2025 @ $3.14 | 6x | 3 months |
| 3 | ZEC W1 | Apr 9, 2025 @ $31.17 | Nov 12, 2025 @ $674 | 21.6x | 7 months |
| 4 | ZEC W2 | Mar 7, 2026 @ $197.82 | May 19, 2026 @ $673.46 | 3.4x | 2.5 months |

**Total: 19 months, 6,608x return**

---

## Part 1: Project Architecture

### Tech Stack
- **Frontend Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.10
- **Styling:** Inline styles (no external CSS framework)
- **Data Source:** CoinGecko API (live price feeds) + Binance API (RSI calculations)
- **Fonts:** Google Fonts (DM Sans, JetBrains Mono, Space Grotesk, Source Serif 4)
- **Deployment:** GitHub Pages via GitHub Actions

### Directory Structure
```
supercycle/
├── package.json                 # Project metadata + dependencies
├── vite.config.js              # Vite build configuration
├── index.html                  # Entry HTML (dark theme, font preloads)
├── src/
│   ├── main.jsx               # React root + CSS resets
│   ├── LiquidityCascade.jsx    # Main dashboard component (4,000+ lines)
│   └── hooks/
│       └── useMarketData.js    # CoinGecko + Binance API integration
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions deployment pipeline
└── README.md                   # Project overview & framework docs
```

---

## Part 2: Core Data Structures

### PHASES Array (src/LiquidityCascade.jsx, lines ~450–650)

Each phase is an object defining asset behavior, mechanics, and signals:

```javascript
const PHASES = [
  {
    id: 1,
    asset: "TAO",
    name: "Bittensor",
    role: "AI Compute Vanguard",
    color: "#9D4EDD",           // Purple
    colorDim: "rgba(157,78,221,0.12)",
    entryDate: "Oct 19, 2023",
    exitDate: "Mar 8, 2024",
    entryPrice: "$46.44",
    exitPrice: "$699.94",
    multiple: "15x",
    capitalIn: 100000,
    capitalOut: 1500000,
    halvingDistance: "N/A",
    monthsFromHalving: -16,     // Relative to April 2028
    entryMonths: "-16 to -1",
    description: "[Asset narrative and role in cycle]",
    mechanics: [                 // 4 bullet points of technical/market mechanics
      "[Mechanic 1]",
      "[Mechanic 2]",
      "[Mechanic 3]",
      "[Mechanic 4]",
    ],
    exitSignal: "[When/how to exit based on market signals]",
    entrySignal: "[When/how to enter, technical requirements]",
    keyInsight: "[1-2 sentence key learning from phase]",
  },
  // ... repeat for TAO, XRP, ZEC (W1), ZEC (W2)
];
```

**Key Fields:**
- `color`: Hex code for phase (TAO: #9D4EDD purple, XRP: #23F0C6 teal, ZEC: #F4B728 gold)
- `multiple`: Realized multiple (e.g., "15x" → displayed as "15.0x")
- `monthsFromHalving`: Relative to April 2028 fulcrum (negative = before, positive = after)
- `mechanics`: 4 items explaining why/how the asset moves in that phase
- `exitSignal` & `entrySignal`: Market conditions triggering rotation

### PREDICTIONS_2028 Array (lines ~590–610)

Timeline of expected rotations for the 2028 halving cycle:

```javascript
const PREDICTIONS_2028 = [
  { phase: 1, asset: "TAO", action: "Entry", timing: "Sep 2026 – Aug 2027", note: "..." },
  { phase: 1, asset: "TAO", action: "Exit → XRP Entry", timing: "Mar 2028", note: "..." },
  { phase: 2, asset: "XRP", action: "Exit → ZEC Entry", timing: "Jun 2028", note: "..." },
  { phase: 3, asset: "ZEC (W1)", action: "Exit to Fiat", timing: "Jan 2029", note: "..." },
  { phase: 4, asset: "ZEC (W2)", action: "Re-entry on Dip", timing: "Mar 2029", note: "..." },
  { phase: 4, asset: "ZEC (W2)", action: "Exit to Fiat", timing: "May 2029", note: "..." },
];
```

### SIGNAL_GRID Array (lines ~600–650)

Real-time trading signals for each phase:

```javascript
const SIGNAL_GRID = [
  {
    phase: 1,
    asset: "TAO",
    color: "#9D4EDD",
    entryWindow: "Sep 2026 – Aug 2027",
    historicalPrecedent: "[Context from historical cycle]",
    signals: [
      { id: "S1-1", threshold: "[Condition]", action: "[Action]", status: "ARMED" },
      { id: "S1-2", threshold: "[Condition]", action: "[Action]", status: "ARMED" },
      { id: "S1-3", threshold: "[Condition]", action: "[Action]", status: "ARMED" },
    ],
  },
  // ... repeat for each phase
];
```

---

## Part 3: Live Data Integration

### useMarketData.js Hook (src/hooks/useMarketData.js)

Fetches live prices and RSI from APIs:

```javascript
export function useMarketData() {
  const [marketData, setMarketData] = useState({
    btcPrice: 0,
    taoPrice: 0,
    xrpPrice: 0,
    zecPrice: 0,
    btcDominance: 0,
    taoRsiWeekly: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      // CoinGecko: bitcoin, tao, ripple, zcash
      const geckoRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tao,ripple,zcash&vs_currencies=usd&include_market_cap=true'
      );
      const geckoData = await geckoRes.json();

      // Binance: TAO weekly RSI
      const binanceRes = await fetch(
        'https://api.binance.com/api/v3/klines?symbol=TAOUSDT&interval=1w&limit=14'
      );
      const klines = await binanceRes.json();
      const rsi = calculateRSI(klines.map(k => parseFloat(k[4]))); // Close prices

      setMarketData({
        btcPrice: geckoData.bitcoin.usd,
        taoPrice: geckoData.tao?.usd,
        xrpPrice: geckoData.ripple?.usd,
        zecPrice: geckoData.zcash?.usd,
        btcDominance: geckoData.bitcoin.usd_market_cap / totalMarketCap * 100,
        taoRsiWeekly: rsi,
      });
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // 5-minute refresh
    return () => clearInterval(interval);
  }, []);

  return marketData;
}
```

**API Calls:**
- **CoinGecko:** `/simple/price?ids=bitcoin,tao,ripple,zcash&vs_currencies=usd`
- **Binance:** `/klines?symbol=TAOUSDT&interval=1w&limit=14` (14 weeks of data for RSI)

**RSI Calculation:**
```javascript
function calculateRSI(closes, period = 14) {
  const deltas = closes.map((c, i) => i > 0 ? c - closes[i-1] : 0).slice(1);
  const gains = deltas.map(d => d > 0 ? d : 0);
  const losses = deltas.map(d => d < 0 ? -d : 0);
  const avgGain = gains.slice(-period).reduce((a,b) => a+b) / period;
  const avgLoss = losses.slice(-period).reduce((a,b) => a+b) / period;
  const rs = avgGain / avgLoss;
  return (100 - (100 / (1 + rs)));
}
```

---

## Part 4: Dashboard Components

### Main Component: LiquidityCascade.jsx

**Tabs (rendered as separate sections):**

1. **Overview**
   - Phase cards showing current prices, multiples, and progress
   - Halving-relative timeline (Month -16 to +25)
   - Capital growth trajectory (log scale)

2. **Macro**
   - Bitcoin halving history table
   - M2 money supply correlation
   - BTC dominance chart
   - Pre/post-halving patterns

3. **Phases**
   - Full phase details (TAO, XRP, ZEC W1, ZEC W2)
   - Mechanics, entry/exit signals, key insights
   - Real-time price overlay

4. **Signals**
   - Signal grid with real-time thresholds
   - RSI displays
   - Entry/exit condition status

5. **Cycles**
   - Historical comparison (2020, 2024, projected 2028)
   - Cycle data table with actual vs projected returns

6. **Execution**
   - Pre-entry checklist
   - Risk allocation framework
   - Capital deployment strategy

7. **Blackpaper**
   - Long-form narrative (~3,000 words)
   - Sections:
     * I. Three Layers (compute, settlement, privacy)
     * II. The Clock (halving as divider)
     * III. Phase 1: AI Discovers Money
     * Interlude: The Waiting Room
     * IV. Phase 2: Institution Arrives
     * V. Phase 3: Privacy Detonation
     * VI. Phase 4: Discipline Trade
     * VII. Psychology of $194M

8. **Calculator**
   - Interactive 4-phase capital flow simulator
   - Inputs: Initial capital ($10K–$1M), risk allocation (50–100%)
   - Outputs: After-phase capital, reserved capital, final portfolio
   - Displays: AFTER TAO → AFTER XRP → AFTER ZEC W1 → AFTER ZEC W2 → FINAL

---

## Part 5: Styling & Visual Identity

### Color Scheme
```javascript
TAO (Phase 1):  #9D4EDD  (Purple - AI/Compute)
XRP (Phase 2):  #23F0C6  (Teal - Settlement/Fintech)
ZEC (Phase 3+): #F4B728  (Gold - Privacy)
Background:     #0A0B0F  (Dark)
Text Primary:   #FFFFFF  (White)
Text Secondary: rgba(255,255,255,0.5)  (50% opacity)
```

### Font Stack
```css
'DM Sans'         /* Body text, 12–14px */
'JetBrains Mono'  /* Data, labels, monospace */
'Space Grotesk'   /* Headers, bold callouts */
'Source Serif 4'  /* Blackpaper long-form */
```

### Layout Patterns
- **Grid Layout:** `display: grid; gridTemplateColumns: repeat(auto-fit, minmax(160px, 1fr))`
- **Flexbox:** `display: flex; flexDirection: column; gap: [spacing]`
- **Cards:** Dark background, subtle border, `rgba(255,255,255,0.03)` fill, 6–10px border-radius
- **Spacing:** 12px padding (cards), 14px margins (sections), 6px gaps (grids)

---

## Part 6: Deployment & Configuration

### vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "./",  // Supports dynamic base path
});
```

### GitHub Actions Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - master
      - claude/liquidity-cascade-fork-planning-zQgav  # Feature branch for Supercycle

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Build
        run: |
          if [ "${{ github.ref }}" = "refs/heads/claude/liquidity-cascade-fork-planning-zQgav" ]; then
            VITE_BASE=/liquidity-cascade/supercycle/ npm run build
          else
            npm run build
          fi
      - name: Prepare deployment directory
        run: |
          if [ "${{ github.ref }}" = "refs/heads/claude/liquidity-cascade-fork-planning-zQgav" ]; then
            mkdir -p deploy/supercycle
            cp -r dist/* deploy/supercycle/
          else
            mkdir -p deploy
            cp -r dist/* deploy/
          fi
      - uses: actions/upload-pages-artifact@v3
        with:
          path: deploy
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**Key Points:**
- Per-branch concurrency groups prevent deployment conflicts
- VITE_BASE set at build time for subdirectory deployments
- Artifact includes entire app (index.html + assets)
- Enable GitHub Pages in repo settings: Settings → Pages → Source → GitHub Actions

---

## Part 7: Building from Scratch

### Step 1: Repository Setup
```bash
git clone <your-repo>
cd supercycle
npm install
```

### Step 2: Create Core Files

**package.json:**
```json
{
  "name": "supercycle",
  "version": "1.0.0",
  "description": "AI Compute + Payments + Privacy supercycle capital rotation model, anchored to Bitcoin 2028 halving",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.10"
  }
}
```

**vite.config.js:** (See Part 6)

**index.html:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0A0B0F" />
    <title>Supercycle</title>
    <meta name="description" content="AI Compute + Payments + Privacy supercycle capital rotation model. TAO → XRP → ZEC, anchored to the 2028 Bitcoin halving." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
    <style>html, body { background: #0A0B0F; margin: 0; }</style>
  </head>
  <body>
    <noscript>This application requires JavaScript to run.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**src/main.jsx:**
```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import LiquidityCascade from "./LiquidityCascade";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LiquidityCascade />
  </React.StrictMode>
);
```

### Step 3: Implement useMarketData.js Hook

(See Part 3 for full code)

### Step 4: Build LiquidityCascade.jsx

Start with the data structures (PHASES, PREDICTIONS_2028, SIGNAL_GRID) then build components:

1. `GalaxyBackground()` – Canvas-based star field + nebula clouds
2. `PhaseCard()` – Individual phase display
3. `TabButtons()` – Navigation tabs
4. `OverviewTab()`, `MacroTab()`, etc. – Tab content
5. `CalculatorSection()` – Interactive capital flow
6. `SignalsTab()` – Real-time trading signals
7. `BlackpaperTab()` – Long-form narrative
8. Main `LiquidityCascade()` – State management + tab routing

### Step 5: Deploy to GitHub Pages

1. Push to main/master or feature branch
2. GitHub Actions automatically builds & deploys
3. Access at `<username>.github.io/<repo>/` or subdirectory

---

## Part 8: Customization Guide

### Changing Phase Data
Edit the PHASES array in LiquidityCascade.jsx (lines ~450–650):
- Update `entryPrice`, `exitPrice`, `multiple`
- Adjust `monthsFromHalving` relative to your halving date
- Change `color` hex codes
- Rewrite `mechanics` bullet points
- Update `exitSignal` and `entrySignal` text

### Adding a 5th Phase
1. Add new object to PHASES array (id: 5)
2. Add entry to PREDICTIONS_2028
3. Add entry to SIGNAL_GRID
4. Update calculator logic in CalculatorSection (phase5In, phase5Out, etc.)
5. Add new color/styling for Phase 5

### Changing the Halving Fulcrum
- Update `monthsFromHalving` values in all PHASES entries
- Update timeline labels in OverviewTab
- Adjust PREDICTIONS_2028 timing entries

### Linking Live Price Feeds
Replace CoinGecko IDs in useMarketData.js:
- `tao` → your asset ID on CoinGecko
- `ripple` → your asset ID
- `zcash` → your asset ID
- Update Binance symbol in RSI calculation (e.g., `TAOUSDT` → `YOURASSETUSDT`)

---

## Part 9: Key Code Sections

### Capital Calculator Logic
```javascript
const phase1Out = initial * 19.66;      // TAO multiple
const phase2In = phase1Out * (riskSplit / 100);
const phase2Out = phase2In * 3.51;      // XRP multiple
const phase3In = phase2Out * (riskSplit / 100);
const phase3Out = phase3In * 21.6;      // ZEC W1 multiple
const phase4In = phase3Out * (riskSplit / 100);
const phase4Out = phase4In * 3.4;       // ZEC W2 multiple (swing trade)
const totalFinal = phase4Out + (phase3Out - phase4In);  // + reserves
```

### Color-Coded Display
```javascript
const phaseColor = PHASES[phaseId - 1].color;  // #9D4EDD, #23F0C6, #F4B728
const phaseName = PHASES[phaseId - 1].asset;   // "TAO", "XRP", "ZEC (W1)", "ZEC (W2)"
```

### Real-Time Updates
```javascript
useEffect(() => {
  const data = useMarketData();
  setMarketData(data);
  
  // Refetch every 5 minutes
  const timer = setInterval(() => {
    // ... refetch logic
  }, 300000);
  
  return () => clearInterval(timer);
}, []);
```

---

## Part 10: Testing & QA Checklist

### Functional Tests
- [ ] All 4 phases load with correct colors, prices, multiples
- [ ] Calculator computes correct capital flow at 100% and 50% risk splits
- [ ] Live prices update from CoinGecko every 5 minutes
- [ ] TAO RSI calculates and displays (0–100 range)
- [ ] All tabs render without errors
- [ ] Blackpaper loads entire narrative text
- [ ] Signals grid shows all thresholds and status

### Visual Tests
- [ ] Dark theme (#0A0B0F background) throughout
- [ ] Colors render correctly: TAO purple, XRP teal, ZEC gold
- [ ] Text legible on dark background
- [ ] Galaxy background renders smoothly
- [ ] Cards/containers have proper spacing and borders
- [ ] Fonts load correctly (check Google Fonts CDN)

### Deployment Tests
- [ ] Build succeeds: `npm run build`
- [ ] Dist folder contains index.html + assets
- [ ] GitHub Pages deployment succeeds
- [ ] App loads at correct URL (root or subdirectory)
- [ ] Assets load correctly (no 404s in browser console)
- [ ] Hard refresh shows latest version

### Edge Cases
- [ ] Mobile responsive (check on iPhone, Android)
- [ ] Slow network: API calls timeout gracefully (show cached values)
- [ ] No internet: Dashboard still loads, prices show "—"
- [ ] Calculator with $0 input
- [ ] Calculator with $1M+ input
- [ ] Risk split at 50%, 75%, 100%

---

## Part 11: Common Issues & Solutions

### 404 on Subdirectory Deployment
**Symptom:** GitHub Pages shows "File not found" at `/supercycle/`

**Solution:**
1. Verify VITE_BASE is set in build environment: `VITE_BASE=/path/ npm run build`
2. Check that index.html is in the correct deployment directory
3. Confirm GitHub Pages is enabled: Settings → Pages → Source → GitHub Actions

### Live Prices Not Updating
**Symptom:** Prices show stale values or API errors

**Solution:**
1. Check CoinGecko API: https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tao,ripple,zcash&vs_currencies=usd
2. Check Binance API: https://api.binance.com/api/v3/klines?symbol=TAOUSDT&interval=1w&limit=14
3. Add error logging to useMarketData.js to debug API failures
4. Implement fallback cached values if API is unavailable

### Concurrency Deployment Conflicts
**Symptom:** One branch's build cancels the other

**Solution:**
- Ensure deploy.yml has per-branch concurrency groups: `group: pages-${{ github.ref }}`
- Set `cancel-in-progress: false` to allow simultaneous builds

### RSI Calculation Errors
**Symptom:** RSI shows NaN or invalid values

**Solution:**
1. Ensure you have at least 14 weeks of Binance data
2. Check that close prices are valid numbers
3. Handle division by zero in avgLoss calculation
4. Add error bounds: RSI must be 0–100

---

## Part 12: Documentation & Narrative

### Blackpaper Structure
The blackpaper is the 7-section narrative that explains:
1. **Three Layers** – Compute (TAO), settlement (XRP), privacy (ZEC)
2. **The Clock** – Bitcoin halving as temporal fulcrum, not trigger
3. **Phase 1: AI Discovers Money** – Retail FOMO on AGI narratives
4. **Interlude: The Waiting Room** – Discipline between phases
5. **Phase 2: Institution Arrives** – ODL, CBDC, regulatory clarity
6. **Phase 3: Privacy Detonation** – CBDC anxiety, regulatory pressure
7. **Phase 4: Discipline Trade** – Psychology of buying retracements
8. **Psychology of $194M** – Execution at scale, capital management

Each section is ~400 words and builds on the previous to create a coherent investment thesis.

### Dashboard Copy
Every section should include:
- **Entry Signal:** Market conditions triggering entry
- **Exit Signal:** Specific thresholds or sentiment indicators
- **Key Insight:** The "aha moment" from historical data
- **Mechanics:** 4 technical/structural reasons the asset moves

---

## Part 13: Version History & Amendments

**v1.0 (May 2026):**
- Initial Supercycle framework (TAO → XRP → ZEC W1/W2)
- 4-phase model with 6,608x realized return
- Live CoinGecko + Binance integration
- GitHub Pages deployment to subdirectory

---

## Quick Start for New Builder

1. **Clone repo:** `git clone <your-fork> && cd supercycle`
2. **Install deps:** `npm install`
3. **Run dev:** `npm run dev` → http://localhost:5173
4. **Edit PHASES array** in src/LiquidityCascade.jsx with your data
5. **Edit SIGNAL_GRID** with your trading thresholds
6. **Update useMarketData.js** with your asset IDs
7. **Customize colors, text, narrative** throughout
8. **Build:** `npm run build`
9. **Deploy:** Push to main → GitHub Actions handles it

---

## Support & Questions

If you need to rebuild or modify Supercycle:
1. Reference the PHASES array structure (Part 2)
2. Check useMarketData.js for API integration (Part 3)
3. Review styling/colors in Part 5
4. Follow customization guide in Part 8
5. Use QA checklist in Part 10 to verify functionality

**Contact:** newanforbi / claude-ai/code
