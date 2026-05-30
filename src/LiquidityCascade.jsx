import { useState, useEffect, useRef, useCallback } from "react";
import { useMarketData } from "./hooks/useMarketData.js";

function GalaxyBackground() {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Deep space base
    ctx.fillStyle = "#0A0B0F";
    ctx.fillRect(0, 0, W, H);

    // Nebula clouds
    const nebulae = [
      { x: W * 0.2, y: H * 0.3, r: W * 0.35, color: "rgba(0,255,163,0.028)" },
      { x: W * 0.75, y: H * 0.55, r: W * 0.3, color: "rgba(100,80,255,0.032)" },
      { x: W * 0.5, y: H * 0.15, r: W * 0.25, color: "rgba(255,107,53,0.022)" },
      { x: W * 0.85, y: H * 0.2, r: W * 0.2, color: "rgba(0,180,255,0.02)" },
    ];
    nebulae.forEach(({ x, y, r, color }) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });

    // Stars
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(42);
    const starCount = Math.floor((W * H) / 2800);

    for (let i = 0; i < starCount; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const size = rand() * rand() * 1.8 + 0.2;
      const brightness = rand() * 0.7 + 0.3;
      const hue = rand() < 0.15 ? (rand() < 0.5 ? "180,255,255" : "255,200,150") : "255,255,255";
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hue},${brightness})`;
      ctx.fill();

      // Occasional soft glow on brighter stars
      if (size > 1.2) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
        glow.addColorStop(0, `rgba(${hue},${brightness * 0.3})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = document.documentElement.scrollHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
}

function ShootingStars() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const starsRef = useRef([]);
  const rafRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const nextSpawnDelayRef = useRef(30000);
  const MAX_STARS = 3;

  function spawnStar(W, H) {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if      (edge === 0) { x = Math.random() * W; y = 0; }
    else if (edge === 1) { x = W;                 y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H; }
    else                 { x = 0;                 y = Math.random() * H; }

    const baseAngles = [Math.PI / 2, Math.PI, Math.PI * 3 / 2, 0];
    const angle = baseAngles[edge] + (Math.random() - 0.5) * (Math.PI * 5 / 9);
    const speed = 6 + Math.random() * 8;

    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      lifetime: 60 + Math.floor(Math.random() * 60),
      tailLen: 80 + Math.random() * 120,
      hue: Math.random() * 60 - 30,
    };
  }

  function drawStar(ctx, star) {
    const progress = star.age / star.lifetime;
    const alpha = 1 - progress;
    const speed = Math.hypot(star.vx, star.vy);
    const tdx = -star.vx / speed;
    const tdy = -star.vy / speed;
    const tx = star.x + tdx * star.tailLen;
    const ty = star.y + tdy * star.tailLen;

    const h = 200 + star.hue;
    const grad = ctx.createLinearGradient(star.x, star.y, tx, ty);
    grad.addColorStop(0,   `hsla(${h},80%,95%,${alpha})`);
    grad.addColorStop(0.3, `hsla(${h},60%,85%,${alpha * 0.4})`);
    grad.addColorStop(1,   `hsla(${h},40%,75%,0)`);

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(star.x, star.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    const gr = 3 + (1 - progress) * 3;
    const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, gr * 4);
    glow.addColorStop(0,   `hsla(${h},90%,100%,${alpha})`);
    glow.addColorStop(0.4, `hsla(${h},80%,95%,${alpha * 0.5})`);
    glow.addColorStop(1,   `hsla(${h},70%,90%,0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(star.x, star.y, gr * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext("2d");

    const sizeRef = { w: 0, h: 0 };
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      sizeRef.w = w;
      sizeRef.h = h;
      ctxRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (timestamp) => {
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, sizeRef.w, sizeRef.h);

      if (timestamp - lastSpawnRef.current >= nextSpawnDelayRef.current) {
        if (starsRef.current.length < MAX_STARS) {
          starsRef.current.push(spawnStar(sizeRef.w, sizeRef.h));
        }
        lastSpawnRef.current = timestamp;
        nextSpawnDelayRef.current = 30000;
      }

      starsRef.current = starsRef.current.filter((star) => {
        star.age += 1;
        star.x   += star.vx;
        star.y   += star.vy;
        if (star.age >= star.lifetime) return false;
        drawStar(ctx, star);
        return true;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}
    />
  );
}

function AlienSaucer() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const saucerRef = useRef(null);
  const rafRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const nextSpawnDelayRef = useRef(60000);

  function spawnSaucer(W, H) {
    const edge = Math.floor(Math.random() * 4);
    let startX, startY;
    if      (edge === 0) { startX = Math.random() * W; startY = -80; }
    else if (edge === 1) { startX = W + 80;             startY = Math.random() * H; }
    else if (edge === 2) { startX = Math.random() * W; startY = H + 80; }
    else                 { startX = -80;                startY = Math.random() * H; }

    const targetX = W * 0.3 + Math.random() * W * 0.4;
    const targetY = H * 0.25 + Math.random() * H * 0.35;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const baseDepart = Math.atan2(dy, dx) + Math.PI;
    const departAngle = baseDepart + (Math.random() - 0.5) * (Math.PI * 0.8);

    return {
      x: startX, y: startY,
      startX, startY,
      targetX, targetY,
      phase: "entering",
      enterAge: 0,
      enterDuration: 90,
      hoverAge: 0,
      hoverDuration: 480,
      departAngle,
      departSpeed: 0,
    };
  }

  function drawSaucer(ctx, s) {
    let drawX = s.x;
    let drawY = s.y;
    let alpha = 1;

    if (s.phase === "entering") {
      alpha = Math.min(1, s.enterAge / s.enterDuration);
    } else if (s.phase === "hovering") {
      drawY += Math.sin(s.hoverAge * 0.05) * 6;
      alpha = 1;
    } else {
      alpha = Math.max(0, 1 - s.departSpeed / 60);
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    // Glow aura
    const aura = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, 70);
    aura.addColorStop(0, "rgba(100,255,150,0.15)");
    aura.addColorStop(1, "rgba(100,255,150,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(drawX, drawY, 70, 0, Math.PI * 2);
    ctx.fill();

    // Tractor beam (hover phase only)
    if (s.phase === "hovering") {
      const beamGrad = ctx.createLinearGradient(drawX, drawY + 8, drawX, drawY + 70);
      beamGrad.addColorStop(0, "rgba(100,255,150,0.18)");
      beamGrad.addColorStop(1, "rgba(100,255,150,0)");
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(drawX - 15, drawY + 8);
      ctx.lineTo(drawX + 15, drawY + 8);
      ctx.lineTo(drawX + 38, drawY + 70);
      ctx.lineTo(drawX - 38, drawY + 70);
      ctx.closePath();
      ctx.fill();
    }

    // Body disc
    const bodyGrad = ctx.createRadialGradient(drawX - 10, drawY - 4, 2, drawX, drawY, 50);
    bodyGrad.addColorStop(0, "#d8ead8");
    bodyGrad.addColorStop(0.6, "#9ab89a");
    bodyGrad.addColorStop(1, "#5a7a5a");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 48, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rim highlight
    ctx.strokeStyle = "rgba(180,255,200,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 48, 13, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Dome
    const domeGrad = ctx.createRadialGradient(drawX - 6, drawY - 16, 1, drawX, drawY - 10, 22);
    domeGrad.addColorStop(0, "rgba(200,240,255,0.85)");
    domeGrad.addColorStop(0.5, "rgba(120,200,255,0.55)");
    domeGrad.addColorStop(1, "rgba(60,130,200,0.25)");
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY - 10, 20, 14, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Rim lights
    const lightColors = ["#00ff88", "#00ddff", "#4488ff", "#ffffff", "#00ff88", "#00ddff", "#88ffcc"];
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const lx = drawX + Math.cos(angle) * 38;
      const ly = drawY + Math.sin(angle) * 10;
      const blink = Math.sin(s.hoverAge * 0.15 + i * 0.9) > 0.2;
      const lightAlpha = s.phase === "hovering" ? (blink ? 1 : 0.3) : 0.7;
      const color = lightColors[i];
      ctx.globalAlpha = alpha * lightAlpha;
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 5);
      lg.addColorStop(0, color);
      lg.addColorStop(1, "transparent");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * lightAlpha * 0.9;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Departure streak
    if (s.phase === "departing" && s.departSpeed > 4) {
      ctx.globalAlpha = alpha * 0.7;
      const streakLen = s.departSpeed * 4;
      const tx = drawX - Math.cos(s.departAngle) * streakLen;
      const ty = drawY - Math.sin(s.departAngle) * streakLen;
      const sg = ctx.createLinearGradient(drawX, drawY, tx, ty);
      sg.addColorStop(0, `rgba(150,255,180,${alpha})`);
      sg.addColorStop(0.4, `rgba(100,220,150,${alpha * 0.3})`);
      sg.addColorStop(1, "rgba(100,220,150,0)");
      ctx.strokeStyle = sg;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }

    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext("2d");

    const sizeRef = { w: 0, h: 0 };
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      sizeRef.w = w;
      sizeRef.h = h;
      ctxRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (timestamp) => {
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, sizeRef.w, sizeRef.h);

      // Spawn
      if (!saucerRef.current && timestamp - lastSpawnRef.current >= nextSpawnDelayRef.current) {
        saucerRef.current = spawnSaucer(sizeRef.w, sizeRef.h);
        lastSpawnRef.current = timestamp;
      }

      const s = saucerRef.current;
      if (s) {
        if (s.phase === "entering") {
          s.enterAge += 1;
          const progress = s.enterAge / s.enterDuration;
          const t = 1 - Math.pow(1 - Math.min(progress, 1), 3);
          s.x = s.startX + (s.targetX - s.startX) * t;
          s.y = s.startY + (s.targetY - s.startY) * t;
          if (s.enterAge >= s.enterDuration) {
            s.x = s.targetX;
            s.y = s.targetY;
            s.phase = "hovering";
          }
        } else if (s.phase === "hovering") {
          s.hoverAge += 1;
          if (s.hoverAge >= s.hoverDuration) s.phase = "departing";
        } else {
          s.departSpeed = s.departSpeed === 0 ? 3 : s.departSpeed * 1.12;
          s.x += Math.cos(s.departAngle) * s.departSpeed;
          s.y += Math.sin(s.departAngle) * s.departSpeed;
          const W = sizeRef.w, H = sizeRef.h;
          if (s.x < -200 || s.x > W + 200 || s.y < -200 || s.y > H + 200) {
            saucerRef.current = null;
            nextSpawnDelayRef.current = 45000 + Math.random() * 30000;
          }
        }
        if (saucerRef.current) drawSaucer(ctx, s);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}
    />
  );
}

const PHASES = [
  {
    id: 1,
    asset: "TAO",
    name: "Bittensor",
    role: "AI Compute Vanguard",
    color: "#9D4EDD",
    colorDim: "rgba(157,78,221,0.12)",
    entryDate: "Oct 19, 2023",
    exitDate: "Mar 8, 2024",
    entryPrice: "$46.44",
    exitPrice: "$699.94",
    multiple: "15x",
    capitalIn: 100000,
    capitalOut: 1500000,
    halvingDistance: "Historical Precedent",
    monthsFromHalving: null,
    entryMonths: "Oct 2023",
    description:
      "Bittensor's AI compute narrative captured the vanguard rotation. TAO exploded 15x in 5 months as retail capital flooded into decentralized AI infrastructure, validator participation incentives, and AGI enthusiasm peaked in late 2023–early 2024.",
    mechanics: [
      "TAO holder incentives drove validator and subnet participation surge",
      "AI hype crescendo from OpenAI o1 progress narratives (late 2023)",
      "Thin order books on centralized exchanges amplified retail FOMO",
      "Entry at $46.44 (deep compression) captured full 15x wave to $699.94",
    ],
    exitSignal:
      "March 2024: AI narrative saturation, retail euphoria peak, pre-Bitcoin halving narrative shift. RSI >78 on weekly. Risk/reward deteriorated as capital rotated to XRP.",
    entrySignal:
      "October 2023: TAO hit $46.44 as crypto bear market bottomed. Validators incentivized, AI demand crescendo began. Capital entered for 5-month vanguard phase.",
    keyInsight:
      "TAO's 15x cycle (Oct 2023 → Mar 2024) proved the Supercycle vanguard thesis. Capital rotated from TAO to XRP exactly as predicted, validating the rotating infrastructure model.",
  },
  {
    id: 2,
    asset: "XRP",
    name: "Ripple",
    role: "Institutional Settlement Proxy",
    color: "#23F0C6",
    colorDim: "rgba(35,240,198,0.12)",
    entryDate: "Oct 2, 2024",
    exitDate: "Jan 8, 2025",
    entryPrice: "$0.5241",
    exitPrice: "$3.14",
    multiple: "6x",
    capitalIn: 1500000,
    capitalOut: 9000000,
    halvingDistance: "Historical Precedent",
    monthsFromHalving: null,
    entryMonths: "Oct 2024",
    description:
      "XRP captured the institutional settlement phase of the Supercycle. After TAO peaked, capital rotated to XRP for the infrastructure play. Ripple's ODL expansion, SEC regulatory clarity, and CBDC adjacency drove a 6x rally in just 3 months.",
    mechanics: [
      "Ripple's ODL (On-Demand Liquidity) corridor expansion accelerated in Q4 2024",
      "SEC vs. Ripple lawsuit resolved favorably (Aug 2024), removing regulatory overhang",
      "CBDC narratives intensified: XRP positioned as institutional settlement layer",
      "Post-Bitcoin halving (Apr 2024) M2 expansion drove institutional capital into infrastructure plays",
    ],
    exitSignal:
      "January 2025: XRP reached institutional saturation at $3.14 (6x from $0.5241). Retail euphoria peaked. Capital rotation signal: shift to terminal phase (ZEC).",
    entrySignal:
      "October 2024: After TAO peaked Mar 2024, capital rotated to XRP at $0.5241. Institutional adoption narratives aligned with post-halving liquidity expansion. Entry signaled rotation from vanguard to settlement infrastructure.",
    keyInsight:
      "XRP's 6x cycle (Oct 2024 → Jan 2025) validated the Supercycle institutional phase. Capital rotated from AI compute (TAO) to payments/settlement (XRP) exactly as the thesis predicted, now rotating to terminal privacy phase (ZEC).",
  },
  {
    id: 3,
    asset: "ZEC",
    name: "Zcash",
    role: "Terminal Blow-Off",
    color: "#F4B728",
    colorDim: "rgba(244,183,40,0.12)",
    entryDate: "Apr 9, 2025",
    exitDate: "Nov 12, 2025",
    entryPrice: "$31.17",
    exitPrice: "$674.00",
    multiple: "21.6x",
    capitalIn: 9000000,
    capitalOut: 194400000,
    halvingDistance: "Historical + Projected",
    monthsFromHalving: null,
    entryMonths: "Apr 2025",
    description:
      "ZEC's terminal phase begins: the blow-off parabolic move as privacy narratives peak amid CBDC anxiety. Capital from XRP rotates into ZEC at the compression point. Thin order books amplify retail euphoria into a 21.6x explosion in just 7 months.",
    mechanics: [
      "Privacy narrative crescendo amid CBDC rollout announcements (Q2-Q3 2025)",
      "Thin ZEC order books on approved exchanges amplify retail FOMO",
      "Apr 9, 2025: XRP exit capital ($9M) enters ZEC at $31.17 compression",
      "Nov 12, 2025: Terminal blow-off peak at $674 — maximum euphoria reached",
      "Take profits completely on terminal top. No remaining position.",
    ],
    exitSignal:
      "Nov 12, 2025 — ZEC reaches $674, terminal blow-off top. 7-day gains >150%, mainstream media coverage peaks. Exit 100% of position to cash. Doomsday vehicle exhausted.",
    entrySignal:
      "Apr 9, 2025 — XRP exit capital ($9M) rotates to ZEC at $31.17 as privacy/CBDC narratives peak. Technical compression + narrative alignment = entry signal.",
    keyInsight:
      "Phase 3 captures the terminal blow-off: $9M → $194.4M (21.6x) in 7 months. Exit completely to fiat—no emotional attachment to the asset going forward.",
  },
  {
    id: 4,
    asset: "ZEC",
    name: "Zcash",
    role: "Retracement Swing Trade",
    color: "#F4B728",
    colorDim: "rgba(244,183,40,0.12)",
    entryDate: "Mar 7, 2026",
    exitDate: "May 19, 2026",
    entryPrice: "$197.82",
    exitPrice: "$673.46",
    multiple: "3.4x",
    capitalIn: 194400000,
    capitalOut: 660842400,
    halvingDistance: "Historical + Projected",
    monthsFromHalving: null,
    entryMonths: "Mar 2026",
    description:
      "The final cycle: a sophisticated swing trade on the retracement. After the Nov 2025 blow-off, ZEC retraces 71% in a standard corrective pattern. Re-entry at the dip using 100% of Phase 3 profits. Final pump to near-previous highs, then full exit to fiat. Supercycle complete.",
    mechanics: [
      "Nov 2025 → Mar 2026: ZEC retraces 71% from $674 to $197.82 (standard correction)",
      "Mar 7, 2026: Buy the dip using all Phase 3 profits ($194.4M capital)",
      "Privacy regulations continue escalating (CBDC threat narrative)",
      "May 19, 2026: ZEC pumps to $673.46 — near previous high, second peak",
      "Exit 100% of position to fiat. Supercycle ends. Capital rotation complete.",
    ],
    exitSignal:
      "May 19, 2026 — ZEC returns to $673.46. Final exit to fiat. No further rotations. Supercycle thesis proven: $100K → $660.8M (6,608x) over 19 months. Capital preserved as fiat.",
    entrySignal:
      "Mar 7, 2026 — ZEC at $197.82 (71% retracement from Nov peak). Re-entry signal: previous narrative still valid, technical compression, phase 3 profits deployed. Swing trade setup confirmed.",
    keyInsight:
      "Phase 4 proves the discipline: after the blow-off, we DON'T panic-sell. We buy the dip and ride the final swing. $194.4M → $660.8M (3.4x) in 2.5 months. Supercycle complete. Total: $100K → $660.8M (6,608x) over 19 months (Oct 2023 → May 2026).",
  },
];

const HALVINGS = [
  { date: "Nov 2012", reward: "50 → 25 BTC" },
  { date: "Jul 2016", reward: "25 → 12.5 BTC" },
  { date: "May 2020", reward: "12.5 → 6.25 BTC" },
  { date: "Apr 2024", reward: "6.25 → 3.125 BTC" },
  { date: "~Apr 2028", reward: "3.125 → 1.5625 BTC" },
];

const PREDICTIONS_2028 = [
  { phase: 1, asset: "TAO", action: "Entry", timing: "Oct 19, 2023", price: "$46.44", note: "AI compute vanguard begins" },
  { phase: 1, asset: "TAO", action: "Exit → XRP Entry", timing: "Mar 8, 2024", price: "$699.94 (15x)", note: "Rotation to institutional settlement" },
  { phase: 2, asset: "XRP", action: "Entry", timing: "Oct 2, 2024", price: "$0.5241", note: "Institutional settlement infrastructure phase" },
  { phase: 2, asset: "XRP", action: "Exit → ZEC Entry", timing: "Jan 8, 2025", price: "$3.14 (6x)", note: "Rotation to terminal privacy overflow" },
  { phase: 3, asset: "ZEC", action: "Blow-Off Entry", timing: "Apr 9, 2025", price: "$31.17", note: "Terminal blow-off begins" },
  { phase: 3, asset: "ZEC", action: "Blow-Off Exit", timing: "Nov 12, 2025", price: "$674.00 (21.6x)", note: "Take profits on terminal top" },
  { phase: 4, asset: "ZEC", action: "Swing Trade Entry", timing: "Mar 7, 2026", price: "$197.82 (retracement)", note: "Buy the dip" },
  { phase: 4, asset: "ZEC", action: "Exit to Fiat", timing: "May 19, 2026", price: "$673.46 (3.4x)", note: 'Final exit: Supercycle complete (6,608x total)' },
];

// ── SIGNALS data ──────────────────────────────────────────────────────────────

const SIGNAL_GRID = [
  {
    phase: 1,
    asset: "TAO",
    color: "#9D4EDD",
    entryWindow: "Sep 2026 – Aug 2027",
    historicalPrecedent: "AI compute infrastructure thesis: TAO front-runs the April 2028 halving, peaking one month prior (Mar 2028) as AGI narratives reach crescendo. Entry window: Sep 2026 – Aug 2027.",
    signals: [
      { id: "S1-1", threshold: "BTC.D < 57.5%", action: "CONFIRM XRP ENTRY", status: "ARMED" },
      { id: "S1-2", threshold: "TAO RSI > 78 weekly", action: "REDUCE 50% POSITION", status: "ARMED" },
      { id: "S1-3", threshold: "Pre-halving AI narrative peak", action: "EXIT REMAINING TAO", status: "ARMED" },
    ],
  },
  {
    phase: 2,
    asset: "XRP",
    color: "#23F0C6",
    entryWindow: "Jun 2028",
    historicalPrecedent: "Institutional settlement infrastructure: XRP captures post-halving institutional demand as SEC clarity and ODL expansion accelerate. Entry window: Jun 2028 – Nov 2028.",
    signals: [
      { id: "S2-1", threshold: "XRP premium > 2.5x entry", action: "BEGIN XRP EXIT", status: "ARMED" },
      { id: "S2-2", threshold: "BTC 30-day momentum stalls", action: "ACCELERATE EXIT", status: "ARMED" },
      { id: "S2-3", threshold: "ZEC/BTC ratio breaks up", action: "CONFIRM ZEC ENTRY", status: "ARMED" },
    ],
  },
  {
    phase: 3,
    asset: "ZEC",
    color: "#F4B728",
    entryWindow: "Apr 9, 2025 – Nov 12, 2025",
    historicalPrecedent: "Terminal blow-off: Privacy narratives peak amid CBDC anxiety. Thin order books amplify retail euphoria. Apr 9, 2025 @ $31.17 → Nov 12, 2025 @ $674.00 (21.6x in 7 months).",
    signals: [
      { id: "S3-1", threshold: "ZEC $31.17 (Apr 9, 2025)", action: "ENTER TERMINAL BLOW-OFF", status: "TRIGGERED" },
      { id: "S3-2", threshold: "ZEC reaches $674 (Nov 12, 2025)", action: "EXIT — TAKE PROFITS 100%", status: "TRIGGERED" },
      { id: "S3-3", threshold: "7-day gains > 150%, media spike", action: "CONFIRM EXIT SIGNAL", status: "TRIGGERED" },
    ],
  },
  {
    phase: 4,
    asset: "ZEC",
    color: "#F4B728",
    entryWindow: "Mar 7, 2026 – May 19, 2026",
    historicalPrecedent: "Retracement swing trade: After Nov 2025 blow-off, ZEC retraces 71% to $197.82. Disciplined re-entry using Phase 3 profits. Final pump to $673.46, then complete exit to fiat. Supercycle ends.",
    signals: [
      { id: "S4-1", threshold: "ZEC retraces to $197.82 (Mar 7, 2026)", action: "ENTER SWING TRADE (BUY DIP)", status: "TRIGGERED" },
      { id: "S4-2", threshold: "ZEC re-pumps to $673.46 (May 19, 2026)", action: "EXIT TO FIAT — FINAL EXIT", status: "TRIGGERED" },
      { id: "S4-3", threshold: "May 19, 2026 Complete", action: "SUPERCYCLE COMPLETE — NO ROTATIONS", status: "TRIGGERED" },
    ],
  },
];

const KEY_THRESHOLDS = [
  { signal: "BTC Dominance Break", asset: "TAO → XRP", threshold: "BTC.D < 57.5%", action: "Rotate to XRP", window: "Month −2 to +3" },
  { signal: "Pre-Halving Saturation", asset: "TAO", threshold: "RSI > 78 weekly + AI narrative peak", action: "Exit TAO entirely", window: "Month −1 to 0" },
  { signal: "XRP Premium Extreme", asset: "XRP", threshold: "Premium > 2.5–3.0x entry", action: "Begin XRP exit", window: "Month +6 to +9" },
  { signal: "BTC Momentum Stall", asset: "XRP", threshold: "30-day price momentum < 0", action: "Accelerate XRP exit", window: "Month +7 to +10" },
  { signal: "ZEC Blow-Off Top", asset: "ZEC → Fiat", threshold: "7-day gain > 150%", action: "Exit 50% immediately", window: "Month +17 to +19" },
  { signal: "Terminal Media Spike", asset: "ZEC", threshold: "Mainstream coverage + euphoria", action: "Exit remaining ZEC", window: "Month +19 to +21" },
];

const PSY_RISKS = [
  {
    title: "FOMO Risk",
    description: "Watching ZEC reach 50x while still holding TAO induces premature rotation. The signal grid exists precisely to counter this. Each phase has an irreversible exit trigger — honor it regardless of apparent upside remaining.",
  },
  {
    title: "Premature Rotation Risk",
    description: "Rotating from TAO to XRP before BTC.D crosses 57.5% means abandoning a live expansion for an unconfirmed one. Confirmation criteria are not suggestions — they are the mechanism separating disciplined execution from speculative guessing.",
  },
];

// ── CYCLES data ───────────────────────────────────────────────────────────────

const CYCLE_DATA = [
  { year: "2012", halvingPrice: "$12", peakPrice: "$1,160", multiple: "96x", multipleNum: 96, monthsToPeak: 12, leadAltcoin: "LTC", altcoinMultiple: "54x", m2Event: "Post-QE3 liquidity expansion" },
  { year: "2016", halvingPrice: "$650", peakPrice: "$19,800", multiple: "30x", multipleNum: 30, monthsToPeak: 17, leadAltcoin: "ETH", altcoinMultiple: "84x", m2Event: "Global M2 +5.4% YoY" },
  { year: "2020", halvingPrice: "$8,600", peakPrice: "$67,500", multiple: "7.85x", multipleNum: 7.85, monthsToPeak: 18, leadAltcoin: "SOL", altcoinMultiple: "140x", m2Event: "COVID fiscal stimulus, M2 +26%" },
  { year: "2024", halvingPrice: "$63,800", peakPrice: "~$120,000", multiple: "~5x", multipleNum: 5, monthsToPeak: 19, leadAltcoin: "ZEC", altcoinMultiple: "~33x", m2Event: "Post-halving liquidity" },
  { year: "2025-26 (SUPERCYCLE)", halvingPrice: "$46.44 (TAO entry Oct 2023)", peakPrice: "$673.46 (ZEC exit May 2026)", multiple: "6,608x REALIZED", multipleNum: 6608, monthsToPeak: 19, leadAltcoin: "TAO→XRP→ZEC", altcoinMultiple: "15x + 6x + 73.6x = 6,608x total", m2Event: "PROVEN: Rotating capital thesis across three infrastructure layers" },
];

const ALTCOIN_WINDOWS = [
  { year: "2012", start: 8,  end: 12, label: "LTC +54x",       color: "#00FFA3" },
  { year: "2016", start: 10, end: 17, label: "ETH +84x",       color: "#FF6B35" },
  { year: "2020", start: 12, end: 18, label: "SOL +140x",      color: "#F4B728" },
  { year: "2024", start: 17, end: 19, label: "ZEC ~33x (proj.)", color: "#6450FF" },
  { year: "SUPERCYCLE-TAO", start: -6, end: 0, label: "TAO +15x",     color: "#9D4EDD" },
  { year: "SUPERCYCLE-XRP", start: 6,  end: 9,  label: "XRP +6x",     color: "#23F0C6" },
  { year: "SUPERCYCLE-ZEC-W1", start: 12, end: 19, label: "ZEC W1 +21.6x",    color: "#F4B728" },
  { year: "SUPERCYCLE-ZEC-W2", start: 23, end: 25, label: "ZEC W2 +3.4x",    color: "#F4B728" },
];

// ── EXECUTION data ────────────────────────────────────────────────────────────

const PRE_ENTRY_CHECKLIST = [
  { item: "Exchange Tier 3 Verification", detail: "Complete KYC/AML for institutional-level withdrawal limits ($500K+/day). Use Coinbase Advanced, Kraken Pro, or Binance Institutional. Required for ZEC OTC desk access." },
  { item: "Hardware Wallet Setup", detail: "Ledger or Trezor configured with a fresh seed phrase. Test a small withdrawal before transferring phase capital. Never store the seed digitally." },
  { item: "Position Size Decision", detail: "Determine Conservative / Moderate / Aggressive tier allocation before touching the market. Pre-commit in writing. Do not adjust mid-phase." },
  { item: "Exit Pre-Commitment", detail: "Write down exact exit thresholds for each phase on paper. Sign and date. This physical record prevents in-the-moment deviation when prices are euphoric." },
  { item: "Tax Basis Tracking Active", detail: "Configure CoinTracker or Koinly with exchange API keys before the first trade. Every entry must be logged immediately — retroactive reconstruction is costly and inaccurate." },
];

const PHASE_PROTOCOLS = [
  {
    asset: "SOL",
    color: "#00FFA3",
    colorDim: "rgba(0,255,163,0.12)",
    venue: "Coinbase Advanced / Kraken Pro",
    entryMethod: "DCA over 4–8 weeks",
    positionType: "Spot only",
    custody: "Self-custody (Phantom wallet)",
    slippageRisk: "LOW",
    slippageBps: "< 50 bps",
    exitTrigger: "Pre-halving RSI > 78 or BTC.D < 57.5%",
  },
  {
    asset: "MSTR",
    color: "#FF6B35",
    colorDim: "rgba(255,107,53,0.12)",
    venue: "Interactive Brokers / Fidelity",
    entryMethod: "Single entry at confirmed breakout",
    positionType: "Equity — common shares",
    custody: "Brokerage account",
    slippageRisk: "LOW",
    slippageBps: "< 30 bps (NYSE listed)",
    exitTrigger: "mNAV > 2.5x or BTC momentum stall",
  },
  {
    asset: "ZEC",
    color: "#F4B728",
    colorDim: "rgba(244,183,40,0.12)",
    venue: "Kraken / OTC desk (large orders)",
    entryMethod: "Limit orders only, 3–5 tranches",
    positionType: "Spot only",
    custody: "Zcash native wallet (shielded)",
    slippageRisk: "HIGH",
    slippageBps: "150–400 bps on orders > $100K",
    exitTrigger: "7-day gain > 150% or media saturation",
  },
];

const POSITION_SIZING = [
  { tier: "Conservative", solPct: "20%", mstrPct: "60%", zecPct: "20%", note: "Preserves most capital; reduced ZEC exposure", isDefault: false },
  { tier: "Moderate",     solPct: "33%", mstrPct: "33%", zecPct: "34%", note: "Balanced phase rotation — recommended default", isDefault: true },
  { tier: "Aggressive",   solPct: "40%", mstrPct: "25%", zecPct: "35%", note: "Maximum ZEC exposure; highest theoretical return", isDefault: false },
];

const EXECUTION_STEPS = [
  { step: 1, title: "Check Spread", detail: "Before any order, verify bid/ask spread is < 0.5% for SOL/MSTR, < 2% for ZEC. Wide spreads signal thin liquidity — delay entry or use OTC." },
  { step: 2, title: "Tranche Entry", detail: "Never deploy full position in one order. Split into 3–5 equal tranches deployed over 24–72 hours. Reduces timing risk and average entry price." },
  { step: 3, title: "Limit Orders Only", detail: "Market orders on illiquid assets (especially ZEC) result in catastrophic slippage. Always place limit orders at or slightly above the current ask for entries." },
  { step: 4, title: "OTC Desk for Large ZEC", detail: "Orders above $500K in ZEC must go through an OTC desk (Cumberland, Genesis Trading, or Kraken OTC). Direct market impact would move the price against you." },
  { step: 5, title: "Transfer to Self-Custody", detail: "Within 24 hours of any acquisition, transfer to a hardware wallet. Exchange insolvency risk is real. ZEC transfers to shielded addresses only." },
  { step: 6, title: "Log Basis Immediately", detail: "Record exact entry price, quantity, timestamp, and exchange within 1 hour of each trade. Cost basis disputes are impossible to resolve retroactively from memory." },
];

const EXECUTION_FAILURES = [
  { title: '"I\'ll buy more when it dips"', description: "DCA entry exists precisely because the dip often never comes. In parabolic phases, waiting for a 10% retracement means missing 300% gains. Tranching is the discipline — execute the plan." },
  { title: "Market Orders on ZEC", description: "A $1M market order on ZEC in a thin order book will consume every ask from $20 to $45 before filling. The slippage alone can exceed 30%. This is not hypothetical — it is arithmetic." },
  { title: "Holding MSTR into Phase 3", description: "MSTR's 1.77x beta amplifies downside as violently as upside. When ZEC begins its terminal spike, MSTR is simultaneously beginning a drawdown. Every day of delay costs compounded capital." },
];

function formatCurrency(n) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n.toFixed(0);
}

function GlowDot({ color, size = 8 }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color}40`,
      }}
    />
  );
}

function PhaseCard({ phase, isActive, onClick, currentPrice }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      style={{
        flex: 1,
        minWidth: 220,
        padding: "20px 18px",
        borderRadius: 10,
        cursor: "pointer",
        background: isActive ? phase.colorDim : "rgba(255,255,255,0.03)",
        border: isActive ? `1.5px solid ${phase.color}50` : "1.5px solid rgba(255,255,255,0.06)",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${phase.color}, transparent)`,
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <GlowDot color={phase.color} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: phase.color,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Phase {phase.id}
        </span>
      </div>
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1.1,
        }}
      >
        {phase.asset}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          marginTop: 4,
        }}
      >
        {phase.role}
      </div>
      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: phase.color, fontWeight: 600 }}>
          {phase.multiple}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
          {phase.entryDate} → {phase.exitDate}
        </span>
      </div>
      {currentPrice != null && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2 }}>
            NOW
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: phase.color, fontWeight: 600 }}>
            ${currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

function CapitalFlowBar({ phases }) {
  const total = phases[phases.length - 1].capitalOut;
  const maxLog = Math.log10(total);
  const minLog = Math.log10(phases[0].capitalIn);
  const logRange = maxLog - minLog;

  return (
    <div style={{ marginTop: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>
          CAPITAL GROWTH TRAJECTORY
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {phases.map((p, i) => {
          const barIn = ((Math.log10(p.capitalIn) - minLog) / logRange) * 100;
          const barOut = ((Math.log10(p.capitalOut) - minLog) / logRange) * 100;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 44,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: p.color,
                  fontWeight: 600,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {p.asset}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 28,
                  position: "relative",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.05)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${barIn}%`,
                    width: `${barOut - barIn}%`,
                    top: 0,
                    bottom: 0,
                    background: `linear-gradient(90deg, ${p.color}20, ${p.color}40)`,
                    borderRight: `2px solid ${p.color}`,
                    transition: "all 0.5s ease",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${Math.min(barOut + 1, 70)}%`,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    paddingLeft: 6,
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>
                    {formatCurrency(p.capitalIn)}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: p.color, whiteSpace: "nowrap" }}>→</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: p.color, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {formatCurrency(p.capitalOut)}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
                    ({p.multiple})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>log scale</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#F4B728" }}>
          Total: {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}

function Timeline({ activePhase, setActivePhase }) {
  const months = [];
  for (let m = -18; m <= 22; m++) months.push(m);

  const phaseRanges = [
    { start: -16, end: -1, phase: 0 },
    { start: 2, end: 7, phase: 1 },
    { start: 9, end: 19, phase: 2 },
  ];

  return (
    <div style={{ margin: "30px 0 10px", position: "relative" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, marginBottom: 12 }}>
        HALVING-RELATIVE TIMELINE (MONTHS)
      </div>
      <div style={{ position: "relative", height: 70, marginTop: 8 }}>
        <div style={{ position: "absolute", top: 30, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }} />
        <div
          style={{
            position: "absolute",
            left: `${((0 + 18) / 40) * 100}%`,
            top: 0,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "#fff",
              background: "rgba(255,255,255,0.12)",
              padding: "2px 6px",
              borderRadius: 3,
              whiteSpace: "nowrap",
            }}
          >
            HALVING
          </div>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.3)" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", boxShadow: "0 0 10px #fff" }} />
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.3)" }} />
        </div>
        {phaseRanges.map((r, i) => {
          const leftPct = ((r.start + 18) / 40) * 100;
          const widthPct = ((r.end - r.start) / 40) * 100;
          const p = PHASES[r.phase];
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Phase ${r.phase + 1} — ${PHASES[r.phase].asset}`}
              onClick={() => setActivePhase(r.phase)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActivePhase(r.phase); } }}
              style={{
                position: "absolute",
                top: 24,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: 12,
                background: activePhase === r.phase ? `${p.color}35` : `${p.color}15`,
                borderRadius: 3,
                cursor: "pointer",
                border: activePhase === r.phase ? `1px solid ${p.color}60` : `1px solid ${p.color}20`,
                transition: "all 0.3s ease",
              }}
            />
          );
        })}
        {PHASES.map((p, i) => {
          const peakMonth = p.monthsFromHalving;
          const leftPct = ((peakMonth + 18) / 40) * 100;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 18,
                left: `${leftPct}%`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 8,
                  color: p.color,
                  marginTop: 18,
                  whiteSpace: "nowrap",
                }}
              >
                {p.asset}
              </div>
            </div>
          );
        })}
        {[-18, -12, -6, 0, 6, 12, 18].map((m) => (
          <div
            key={m}
            style={{
              position: "absolute",
              top: 44,
              left: `${((m + 18) / 40) * 100}%`,
              transform: "translateX(-50%)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: m === 0 ? "#fff" : "rgba(255,255,255,0.25)",
            }}
          >
            {m > 0 ? `+${m}` : m}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseDetail({ phase }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "24px 22px",
        marginTop: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: phase.colorDim,
            border: `1px solid ${phase.color}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: phase.color,
            fontWeight: 700,
          }}
        >
          {phase.id}
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 600, color: "#fff" }}>
            {phase.name} ({phase.asset})
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: phase.color, letterSpacing: 1 }}>
            {phase.role.toUpperCase()}
          </div>
        </div>
      </div>

      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.7)", margin: "0 0 20px" }}>
        {phase.description}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "ENTRY", value: phase.entryPrice, sub: phase.entryDate },
          { label: "EXIT", value: phase.exitPrice, sub: phase.exitDate },
          { label: "MULTIPLE", value: phase.multiple, sub: phase.halvingDistance },
          { label: "CAPITAL OUT", value: formatCurrency(phase.capitalOut), sub: `from ${formatCurrency(phase.capitalIn)}` },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 6,
              padding: "12px 14px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: phase.color, fontWeight: 600 }}>
              {item.value}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, marginBottom: 8 }}>
          STRUCTURAL MECHANICS
        </div>
        {phase.mechanics.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
            <span style={{ color: phase.color, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, marginTop: 1 }}>→</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
              {m}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          background: `${phase.color}08`,
          border: `1px solid ${phase.color}20`,
          borderRadius: 6,
          padding: "12px 14px",
          marginBottom: 14,
        }}
      >
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: phase.color, letterSpacing: 1.5, marginBottom: 4 }}>
          EXIT SIGNAL
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>
          {phase.exitSignal}
        </div>
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 1.55 }}>
        {phase.keyInsight}
      </div>
    </div>
  );
}

function CalculatorSection() {
  const [initial, setInitial] = useState(100000);
  const [riskSplit, setRiskSplit] = useState(100);

  // Supercycle: TAO (15x) → XRP (6x) → ZEC Wave 1 (21.6x) → ZEC Wave 2 (3.4x)
  const phase1Out = initial * 15; // TAO: $100K → $1.5M
  const phase2In = phase1Out * (riskSplit / 100);
  const phase2Reserve = phase1Out - phase2In;
  const phase2Out = phase2In * 6; // XRP: $1.5M → $9M
  const phase3In = phase2Out * (riskSplit / 100);
  const phase3Reserve = phase2Out - phase3In + phase2Reserve;
  const phase3Out = phase3In * 21.6; // ZEC Wave 1: $9M → $194.4M
  const phase4In = phase3Out * (riskSplit / 100);
  const phase4Reserve = phase3Out - phase4In + phase3Reserve;
  const phase4Out = phase4In * 3.4; // ZEC Wave 2: $194.4M → $660.8M
  const totalFinal = phase4Out + phase4Reserve;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "24px 22px",
        marginTop: 20,
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, marginBottom: 16 }}>
        ROTATION CALCULATOR
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
            Initial Capital
          </label>
          <input
            type="range"
            min={10000}
            max={1000000}
            step={10000}
            value={initial}
            onChange={(e) => setInitial(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#00FFA3" }}
          />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: "#fff", marginTop: 4 }}>
            {formatCurrency(initial)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
            Rotation Commitment ({riskSplit}% forward / {100 - riskSplit}% reserved)
          </label>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={riskSplit}
            onChange={(e) => setRiskSplit(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#FF6B35" }}
          />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            {riskSplit === 100 ? "Full rotation (maximum risk/reward)" : `${riskSplit}/${100 - riskSplit} split (risk-mitigated)`}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {[
          { label: "AFTER TAO (Phase 1)", value: phase1Out, color: "#9D4EDD" },
          { label: "AFTER XRP (Phase 2)", value: phase2Out, color: "#23F0C6" },
          { label: "AFTER ZEC WAVE 1 (Phase 3)", value: phase3Out, color: "#F4B728" },
          { label: "AFTER ZEC WAVE 2 (Phase 4)", value: phase4Out, color: "#F4B728" },
          { label: "RESERVED IN FIAT", value: phase4Reserve, color: "rgba(255,255,255,0.5)" },
          { label: "FINAL PORTFOLIO", value: totalFinal, color: "#F4B728" },
        ].map((r, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 6,
              padding: "12px 14px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 4 }}>
              {r.label}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: r.color, fontWeight: 600 }}>
              {formatCurrency(r.value)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
        * Theoretical returns based on historical 2022–2025 cycle multiples. Past performance does not guarantee future results.
        {riskSplit < 100 && ` Reserved capital earns 0% in this model — real yield-bearing fiat instruments would increase total.`}
      </div>
    </div>
  );
}

function Predictions2028() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "24px 22px",
        marginTop: 20,
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, marginBottom: 6 }}>
        SUPERCYCLE EXECUTION (HISTORICAL 2023–2026)
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 18 }}>
        Realized capital rotation across TAO, XRP, and ZEC phases: October 2023 → May 2026
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {PREDICTIONS_2028.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 0",
              borderBottom: i < PREDICTIONS_2028.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: PHASES[p.phase - 1].colorDim,
                border: `1px solid ${PHASES[p.phase - 1].color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: PHASES[p.phase - 1].color,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {p.asset}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#fff" }}>{p.action}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{p.note}</div>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: PHASES[p.phase - 1].color,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {p.timing}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroContext() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "24px 22px",
        marginTop: 20,
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, marginBottom: 14 }}>
        MACROECONOMIC PRECONDITIONS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "14px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 6 }}>
            M2 CORRELATION
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, color: "#00FFA3", fontWeight: 700 }}>84%+</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            Global M2 to crypto price correlation
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "14px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 6 }}>
            LIQUIDITY LAG
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, color: "#FF6B35", fontWeight: 700 }}>56–60d</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            M2 expansion → crypto price action delay
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "14px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 6 }}>
            GLOBAL M2 (Q1 2026)
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, color: "#F4B728", fontWeight: 700 }}>$140T+</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            Continued expansion providing structural tailwind
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 10, marginTop: 20 }}>
        BITCOIN HALVING HISTORY
      </div>
      <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
        {HALVINGS.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 100,
              padding: "10px 12px",
              borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
              background: i === 3 ? "rgba(255,255,255,0.04)" : "transparent",
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: i === 3 ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: i === 3 ? 700 : 400 }}>
              {h.date}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
              {h.reward}
            </div>
            {i === 3 && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#00FFA3", marginTop: 3, letterSpacing: 1 }}>
                MONTH 0
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BtcDominanceNote() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "20px 22px",
        marginTop: 20,
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, marginBottom: 10 }}>
        TRANSITORY SIGNAL — BTC.D
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.55)", margin: 0 }}>
        Bitcoin Dominance (BTC.D) serves as the technical trigger for rotation timing. During accumulation and early post-halving expansion,
        dominance rises as capital seeks the benchmark asset. When BTC.D breaks below the 57–58.8% threshold after establishing new
        all-time highs, capital systemically rotates into altcoins. In the 2021 cycle, BTC.D collapsed roughly 35 days after Bitcoin's initial
        momentum peak. Monitoring this metric prevents premature rotation and ensures deployment exactly when the market is primed for expansion.
      </p>
    </div>
  );
}

// ── SIGNALS component ─────────────────────────────────────────────────────────

function SignalsTab() {
  const { btcDominance, taoRsiWeekly, loading, error, lastUpdated } = useMarketData();

  const statusColor = (s) =>
    s === "TRIGGERED" ? "#00FFA3" : s === "ARMED" ? "#F4B728" : "rgba(255,255,255,0.25)";

  // Derive active phase from SIGNAL_GRID — first phase with any ARMED signal
  const activeIdx        = SIGNAL_GRID.findIndex(g => g.signals.some(s => s.status === "ARMED"));
  const activePhase      = PHASES[activeIdx];
  const activeSignalPhase = SIGNAL_GRID[activeIdx];

  // Month counter relative to next halving (~Apr 2028), not the 2024 cycle PHASES data
  const NEXT_HALVING    = new Date('2028-04-19');
  const monthsToHalving = Math.round((NEXT_HALVING - new Date()) / (1000 * 60 * 60 * 24 * 30.44));
  const monthLabel      = monthsToHalving > 0
    ? `Month -${monthsToHalving}`
    : `Month +${Math.abs(monthsToHalving)}`;

  return (
    <div>
      <style>{`@keyframes pulse-glow { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>

      {/* Cycle Status Banner — data-driven from PHASES + SIGNAL_GRID */}
      <div style={{
        background: `${activePhase.color}08`,
        border: `1px solid ${activePhase.color}25`,
        borderRadius: 10,
        padding: "20px 24px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            display: "inline-block", width: 10, height: 10, borderRadius: "50%",
            background: activePhase.color,
            boxShadow: `0 0 10px ${activePhase.color}, 0 0 20px ${activePhase.color}40`,
            animation: "pulse-glow 2s ease-in-out infinite",
          }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>
            NEXT PHASE — 2028 CYCLE
          </span>
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: activePhase.color }}>
          Phase {activeIdx + 1} — {activePhase.asset}
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5 }}>
            TO ~MAR 2028 HALVING
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#fff" }}>
            {monthLabel}
          </div>
        </div>
      </div>

      {/* Current market metric boxes — MacroContext tile pattern */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        CURRENT WATCH METRICS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 8 }}>
        {[
          {
            label: "BTC DOMINANCE",
            value: loading && btcDominance == null ? "…" : btcDominance != null ? `${btcDominance.toFixed(1)}%` : "—",
            desc: "Watch for < 57.5% to confirm SOL entry",
            color: "#00FFA3",
          },
          {
            label: "TAO RSI (WEEKLY)",
            value: loading && taoRsiWeekly == null ? "…" : taoRsiWeekly != null ? String(taoRsiWeekly) : "—",
            desc: "Entry window below 40 — accumulation phase",
            color: "#9D4EDD",
          },
          {
            label: "XRP Premium",
            value: "—",
            desc: "Live data unavailable — verify manually",
            color: "#F4B728",
          },
          {
            label: "ENTRY WINDOW",
            value: activeSignalPhase.entryWindow,
            desc: `Active accumulation window — Phase ${activeSignalPhase.phase} ${activeSignalPhase.asset}`,
            color: activePhase.color,
            highlight: true,
          },
        ].map((m) => (
          <div key={m.label} style={{
            background: m.highlight ? `${m.color}08` : "rgba(255,255,255,0.03)",
            border: m.highlight ? `1px solid ${m.color}25` : "1px solid transparent",
            borderRadius: 6,
            padding: "14px 16px",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: m.highlight ? m.color : "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 6 }}>
              {m.label}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: m.highlight ? 16 : 26, color: m.color, fontWeight: 700, lineHeight: 1.3 }}>{m.value}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{m.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 1, marginBottom: 28 }}>
        {lastUpdated
          ? `LIVE — LAST UPDATED ${lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
          : "FETCHING LIVE DATA…"}
        {error && ` — ${error.toUpperCase()}`}
      </div>

      {/* Signal Grid */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        SIGNAL GRID — ALL PHASES
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 36 }}>
        {SIGNAL_GRID.map((phase) => (
          <div key={phase.phase} style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${phase.color}30`,
            borderRadius: 10,
            padding: "18px 20px",
            borderTop: `2px solid ${phase.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GlowDot color={phase.color} size={6} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: phase.color, letterSpacing: 1.5 }}>
                  PHASE {phase.phase} — {phase.asset}
                </span>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: phase.color, background: `${phase.color}12`,
                border: `1px solid ${phase.color}35`, borderRadius: 4,
                padding: "3px 7px", letterSpacing: 0.8, whiteSpace: "nowrap",
              }}>
                {phase.entryWindow}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {phase.signals.map((sig) => (
                <div key={sig.id} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.72)", lineHeight: 1.4 }}>
                      {sig.threshold}
                    </span>
                    <span style={{
                      flexShrink: 0,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8,
                      color: statusColor(sig.status),
                      letterSpacing: 0.8,
                      border: `1px solid ${statusColor(sig.status)}40`,
                      borderRadius: 4,
                      padding: "2px 6px",
                      whiteSpace: "nowrap",
                    }}>
                      {sig.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    → {sig.action}
                  </div>
                </div>
              ))}
            </div>
            {/* Entry condition box */}
            <div style={{
              marginTop: 12,
              background: `${PHASES[phase.phase - 1].color}05`,
              border: `1px solid ${PHASES[phase.phase - 1].color}18`,
              borderRadius: 6,
              padding: "10px 12px",
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: PHASES[phase.phase - 1].color, letterSpacing: 1.5, marginBottom: 4, opacity: 0.7 }}>
                ENTRY CONDITION
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, lineHeight: 1.55, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                {PHASES[phase.phase - 1].entrySignal}
              </p>
            </div>
            {/* Exit condition box — PhaseDetail exit-signal box pattern */}
            <div style={{
              marginTop: 12,
              background: `${PHASES[phase.phase - 1].color}08`,
              border: `1px solid ${PHASES[phase.phase - 1].color}20`,
              borderRadius: 6,
              padding: "10px 12px",
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: PHASES[phase.phase - 1].color, letterSpacing: 1.5, marginBottom: 4 }}>
                EXIT CONDITION
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, lineHeight: 1.55, color: "rgba(255,255,255,0.55)", margin: 0 }}>
                {PHASES[phase.phase - 1].exitSignal}
              </p>
            </div>
            {/* Historical precedent — PhaseDetail keyInsight style */}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${phase.color}15` }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.38)", fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>
                {phase.historicalPrecedent}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Rotation Decision Tree */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        ROTATION DECISION TREE
      </div>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "22px 24px",
        marginBottom: 36,
        overflowX: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "stretch", minWidth: 560 }}>
          {[
            { label: "SOL: EXIT WHEN", detail: "RSI > 78 or BTC.D < 57.5%",       color: "#00FFA3", flexWeight: 1,   state: "done"   },
            { label: "MSTR: EXIT WHEN", detail: "mNAV > 2.5x or momentum stalls",  color: "#FF6B35", flexWeight: 1.5, state: "active" },
            { label: "ZEC: EXIT WHEN",  detail: "7-day gain > 150% or media peaks", color: "#F4B728", flexWeight: 2,   state: "future" },
            { label: "FIAT",            detail: "No further crypto rotations",       color: "rgba(255,255,255,0.3)", flexWeight: 0.8, state: "future" },
          ].map((node, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: node.flexWeight }}>
              <div style={{
                flex: 1,
                background: node.state === "active"
                  ? `${node.color}18`
                  : node.state === "done"
                  ? "rgba(255,255,255,0.04)"
                  : `${node.color}0a`,
                border: node.state === "active"
                  ? `1px solid ${node.color}60`
                  : `1px solid ${node.color}30`,
                borderRadius: 8,
                padding: "14px 16px",
              }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: node.color, letterSpacing: 1.2, marginBottom: 6 }}>
                  {node.label}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.45 }}>
                  {node.detail}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ padding: "0 10px", color: "rgba(255,255,255,0.2)", fontSize: 20, flexShrink: 0 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Threshold Table */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        KEY THRESHOLD TABLE
      </div>
      <div style={{ overflowX: "auto", marginBottom: 36 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.8fr 1.3fr 1.2fr 0.85fr", gap: 0, minWidth: 680 }}>
          {["Signal", "Asset", "Threshold", "Action", "Month Window"].map((h) => (
            <div key={h} style={{
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: 1.2,
            }}>
              {h.toUpperCase()}
            </div>
          ))}
          {KEY_THRESHOLDS.map((row, i) => {
            const ac = row.asset.includes("SOL") ? "#00FFA3" : row.asset.includes("MSTR") ? "#FF6B35" : "#F4B728";
            return [row.signal, row.asset, row.threshold, row.action, row.window].map((cell, j) => (
              <div key={`${i}-${j}`} style={{
                padding: "10px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                fontFamily: j === 1 ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
                fontSize: j === 1 ? 10 : 12,
                color: j === 1 ? ac : j === 4 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.6)",
              }}>
                {cell}
              </div>
            ));
          })}
        </div>
      </div>

      {/* Psychological Risk Cards */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        PSYCHOLOGICAL RISK VECTORS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {PSY_RISKS.map((risk, i) => (
          <div key={i} style={{
            background: "rgba(255,60,60,0.06)",
            border: "1px solid rgba(255,60,60,0.18)",
            borderRadius: 10,
            padding: "18px 20px",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,80,80,0.8)", letterSpacing: 1.5, marginBottom: 10 }}>
              ⚠ {risk.title.toUpperCase()}
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.58)", margin: 0 }}>
              {risk.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CYCLES component ──────────────────────────────────────────────────────────

function CyclesTab() {
  const [activeCycle, setActiveCycle] = useState(null);
  const maxMultiple = 96;
  const cycleColors = ["#00FFA3", "#FF6B35", "#F4B728", "#6450FF"];
  const maxMonths = 24;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 8 }}>
          EMPIRICAL FOUNDATION — FOUR-CYCLE ANALYSIS
        </div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          margin: "0 0 12px",
          lineHeight: 1.2,
          background: "linear-gradient(135deg, #00FFA3, #FF6B35, #F4B728)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Historical Halving Cycles
        </h2>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.5)", margin: 0, maxWidth: 700 }}>
          The cascade thesis is not speculation — it is pattern recognition across four complete cycles. Each halving has produced a measurable sequence: BTC expansion, dominance break, altcoin overflow. The asset names rotate; the structure does not.
        </p>
      </div>

      {/* 4-Cycle Comparison Grid */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        4-CYCLE COMPARISON
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 36 }}>
        {CYCLE_DATA.map((c, i) => (
          <div key={c.year}
            role="button"
            tabIndex={0}
            aria-expanded={activeCycle === i}
            onClick={() => setActiveCycle(activeCycle === i ? null : i)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveCycle(activeCycle === i ? null : i); } }}
            style={{
              background: activeCycle === i ? `${cycleColors[i]}10` : "rgba(255,255,255,0.02)",
              border: activeCycle === i ? `1.5px solid ${cycleColors[i]}55` : `1px solid ${cycleColors[i]}30`,
              borderRadius: 10,
              padding: "18px 20px",
              borderTop: `2px solid ${cycleColors[i]}`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <GlowDot color={cycleColors[i]} size={6} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: cycleColors[i], letterSpacing: 1.5 }}>
                {c.year} HALVING
              </span>
            </div>
            {/* Altcoin hero stat — PhaseCard large-ticker pattern */}
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${cycleColors[i]}20` }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: cycleColors[i], letterSpacing: 1.2, marginBottom: 4, opacity: 0.7 }}>
                {c.leadAltcoin} — LEAD ALTCOIN
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: cycleColors[i], lineHeight: 1 }}>
                {c.altcoinMultiple}
              </div>
            </div>
            {[
              ["Halving Price", c.halvingPrice],
              ["Peak Price", c.peakPrice],
              ["BTC Multiple", c.multiple],
              ["Months to Peak", `${c.monthsToPeak} mo`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        ))}

        {/* 2028 Projection card — uses PREDICTIONS_2028 data, dashed PROJECTION badge */}
        {(() => {
          const proj2028Color = "#6450FF";
          return (
            <div style={{
              background: "rgba(100,80,255,0.03)",
              border: `1px solid ${proj2028Color}25`,
              borderRadius: 10,
              padding: "18px 20px",
              borderTop: `2px dashed ${proj2028Color}`,
              opacity: 0.85,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <GlowDot color={proj2028Color} size={6} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: proj2028Color, letterSpacing: 1.5 }}>
                  ~2028 HALVING
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: proj2028Color,
                  border: `1px dashed ${proj2028Color}50`, borderRadius: 3, padding: "1px 5px", marginLeft: 2,
                }}>
                  PROJECTION
                </span>
              </div>
              <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${proj2028Color}15` }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: proj2028Color, letterSpacing: 1.2, marginBottom: 4, opacity: 0.7 }}>
                  ZEC — LEAD ALTCOIN
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: proj2028Color, lineHeight: 1 }}>
                  ~33x (est.)
                </div>
              </div>
              {[
                ["Halving Price", "~$90,000"],
                ["Peak Price", "~$450,000"],
                ["BTC Multiple", "~4–5x (est.)"],
                ["Months to Peak", "~19 mo"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Expanded cycle detail panel — PhaseDetail structure */}
      {activeCycle !== null && (() => {
        const c = CYCLE_DATA[activeCycle];
        const color = cycleColors[activeCycle];
        // Map cycle index to PHASES: 2020=SOL(0), 2024=ZEC(2); others use generic narrative
        const phaseMap = { 2: PHASES[0], 3: PHASES[2] };
        const ph = phaseMap[activeCycle];
        return (
          <div style={{
            background: `${color}08`,
            border: `1px solid ${color}30`,
            borderRadius: 10,
            padding: "22px 24px",
            marginBottom: 28,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <GlowDot color={color} size={7} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color }}>
                {c.year} — {c.leadAltcoin} Cycle
              </span>
            </div>
            {ph && (
              <>
                <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.6)", margin: "0 0 16px" }}>
                  {ph.description}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {ph.mechanics.map((m, mi) => (
                    <div key={mi} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, flexShrink: 0 }}>→</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>{m}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color, letterSpacing: 1.5, marginBottom: 4 }}>CYCLE EXIT SIGNAL</div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>{ph.exitSignal}</p>
                </div>
              </>
            )}
            {!ph && (
              <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                The {c.year} cycle preceded the current cascade instrument set. {c.leadAltcoin} served as the terminal liquidity vehicle, peaking approximately {c.monthsToPeak} months after the halving with a {c.altcoinMultiple} multiple — establishing the structural precedent this cascade replicates.
              </p>
            )}
          </div>
        );
      })()}

      {/* Diminishing Returns Bar Chart */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        BTC CYCLE MULTIPLES — DIMINISHING RETURNS
      </div>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "22px 24px",
        marginBottom: 14,
      }}>
        {CYCLE_DATA.map((c, i) => (
          <div key={c.year} style={{ marginBottom: i < CYCLE_DATA.length - 1 ? 16 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cycleColors[i], width: 36 }}>{c.year}</span>
              <div style={{ flex: 1, height: 20, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${(c.multipleNum / maxMultiple) * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${cycleColors[i]}cc, ${cycleColors[i]}55)`,
                  borderRadius: 4,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", width: 44, textAlign: "right" }}>
                {c.multiple}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 36,
      }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.45)", margin: 0 }}>
          BTC cycle multiples are compressing — 96x → 30x → 7.85x → ~5x. Yet altcoin rotation remains viable precisely because the <span style={{ color: "#F4B728" }}>liquidity overflow dynamic</span> amplifies diminishing BTC gains through sequenced leverage. A 5x BTC move routed through MSTR (1.77x beta) and then into a thin-order-book privacy coin produces outsized terminal returns despite a lower headline BTC multiple.
        </p>
      </div>

      {/* Multi-Cycle Timeline Overlay */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        ALTCOIN ROTATION WINDOW — MULTI-CYCLE OVERLAY
      </div>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "22px 24px",
        marginBottom: 36,
        overflowX: "auto",
      }}>
        <div style={{ minWidth: 500 }}>
          {/* Month axis labels — absolute-positioned within bar area (matches Timeline technique) */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 36, flexShrink: 0 }} />
            <div style={{ flex: 1, position: "relative", height: 14 }}>
              {[0, 4, 8, 12, 16, 20, 24].map((m) => (
                <div key={m} style={{
                  position: "absolute",
                  left: `${(m / maxMonths) * 100}%`,
                  transform: "translateX(-50%)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 8,
                  color: "rgba(255,255,255,0.2)",
                  whiteSpace: "nowrap",
                }}>
                  +{m}m
                </div>
              ))}
            </div>
          </div>
          {ALTCOIN_WINDOWS.map((w) => (
            <div key={w.year} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: w.color, width: 36, flexShrink: 0 }}>{w.year}</span>
              <div style={{ flex: 1, position: "relative", height: 28, background: "rgba(255,255,255,0.03)", borderRadius: 4 }}>
                <div style={{
                  position: "absolute",
                  left: `${(w.start / maxMonths) * 100}%`,
                  width: `${((w.end - w.start) / maxMonths) * 100}%`,
                  top: 0,
                  height: "100%",
                  background: `${w.color}30`,
                  border: `1px solid ${w.color}60`,
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: w.color, whiteSpace: "nowrap" }}>
                    {w.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ paddingLeft: 48, marginTop: 6 }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
              Months after halving. Bars indicate peak altcoin rotation window.
            </div>
          </div>
        </div>
      </div>

      {/* M2 Correlation Table */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        M2 CORRELATION — CYCLE MAPPING
      </div>
      <div style={{ overflowX: "auto", marginBottom: 36 }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 80px 100px 1fr", gap: 0, minWidth: 500 }}>
          {["Cycle", "BTC Multiple", "Lead Alt", "Concurrent M2 Event"].map((h) => (
            <div key={h} style={{
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: 1.2,
            }}>
              {h.toUpperCase()}
            </div>
          ))}
          {CYCLE_DATA.map((c, i) => (
            [c.year, c.multiple, c.leadAltcoin, c.m2Event].map((cell, j) => (
              <div key={`${i}-${j}`} style={{
                padding: "10px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                fontFamily: j === 0 ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
                fontSize: 12,
                color: j === 0 ? cycleColors[i] : j === 2 ? cycleColors[i] : "rgba(255,255,255,0.55)",
                display: j === 0 ? "flex" : undefined,
                alignItems: j === 0 ? "center" : undefined,
                gap: j === 0 ? 6 : undefined,
              }}>
                {j === 0 && <GlowDot color={cycleColors[i]} size={5} />}
                {cell}
              </div>
            ))
          ))}
        </div>
      </div>

      {/* Pattern Validation */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        PATTERN VALIDATION
      </div>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "24px 26px",
      }}>
        <BlackpaperPara>
          Across every completed halving cycle, a structurally identical sequence has repeated: Bitcoin consolidates supply shock gains, dominance peaks, capital rotates into the cycle's vanguard altcoin, and finally overflows into legacy assets with thin liquidity and outsized volatility. The instruments differ per cycle — LTC in 2013, ETH in 2017, SOL in 2021 — but the mechanism is invariant.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Diminishing BTC multiples do not invalidate the cascade. They are a feature of increasing market capitalization, not a failure of the pattern. A market that is ten times larger requires ten times more capital to move — but the <span style={{ color: "#F4B728" }}>rotation sequence itself</span> concentrates that capital into increasingly narrow windows, producing terminal volatility that exceeds earlier cycles in absolute dollar terms even as percentage multiples compress.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The ZEC Month +17–19 window does not appear in isolation. It appears at the same relative position across every cycle in which a terminal privacy or legacy asset participated. The 2018 and 2021 precedents are not anecdotes. They are data points in a statistically consistent distribution.
        </BlackpaperPara>
        <BlackpaperQuote color="#F4B728">
          "The asset names change. The timing tightens. The sequence does not."
        </BlackpaperQuote>
      </div>
    </div>
  );
}

// ── EXECUTION component ───────────────────────────────────────────────────────

function ExecutionTab() {
  const [checked, setChecked] = useState([false, false, false, false, false]);
  const [activeStep, setActiveStep] = useState(1);
  const doneCount = checked.filter(Boolean).length;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 8 }}>
          OPERATIONAL MANUAL — TRADE EXECUTION
        </div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          margin: "0 0 12px",
          lineHeight: 1.2,
          background: "linear-gradient(135deg, #00FFA3, #FF6B35, #F4B728)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          How to Execute the Cascade
        </h2>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.5)", margin: 0, maxWidth: 700 }}>
          Knowing what to do and when is insufficient. The edge is destroyed at the execution layer — wrong venue, wrong order type, unlogged basis, missed custody transfer. This section closes that gap.
        </p>
      </div>

      {/* Pre-Entry Checklist */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>
          PRE-ENTRY CHECKLIST
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: doneCount === 5 ? "#00FFA3" : "rgba(255,255,255,0.3)", letterSpacing: 1 }}>
          SETUP PROGRESS — {doneCount} / 5 COMPLETE
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ width: `${(doneCount / 5) * 100}%`, height: "100%", background: "linear-gradient(90deg, #00FFA3, #00FFA360)", borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
        {PRE_ENTRY_CHECKLIST.map((row, i) => (
          <div key={i}
            role="checkbox"
            aria-checked={checked[i]}
            tabIndex={0}
            onClick={() => setChecked(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setChecked(prev => { const n = [...prev]; n[i] = !n[i]; return n; }); } }}
            style={{
              display: "flex",
              gap: 16,
              background: checked[i] ? "rgba(0,255,163,0.04)" : "rgba(255,255,255,0.02)",
              border: checked[i] ? "1px solid rgba(0,255,163,0.2)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "14px 16px",
              alignItems: "flex-start",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}>
            <div style={{
              flexShrink: 0,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: checked[i] ? "#00FFA3" : "transparent",
              border: checked[i] ? "1px solid #00FFA3" : "1px solid rgba(0,255,163,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: checked[i] ? "#000" : "#00FFA3",
              transition: "all 0.2s ease",
            }}>
              {checked[i] ? "✓" : i + 1}
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: checked[i] ? "rgba(255,255,255,0.5)" : "#fff", marginBottom: 4, transition: "color 0.2s" }}>
                {row.item}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>
                {row.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Phase Entry Protocols */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        PHASE ENTRY PROTOCOLS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 36 }}>
        {PHASE_PROTOCOLS.map((p, i) => (
          <div key={p.asset} style={{
            background: p.colorDim,
            border: `1px solid ${p.color}30`,
            borderRadius: 10,
            padding: "18px 20px",
            borderTop: `2px solid ${p.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <GlowDot color={p.color} size={6} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: p.color, letterSpacing: 1, fontWeight: 600 }}>
                {p.asset}
              </span>
            </div>
            {/* Phase link mini-metrics — PhaseDetail metrics-grid style */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                ["HISTORICAL MULTIPLE", PHASES[i].multiple, p.color],
                ["CAPITAL OUT", formatCurrency(PHASES[i].capitalOut), p.color],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 10px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color, fontWeight: 700 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
            {[
              ["Venue", p.venue],
              ["Entry Method", p.entryMethod],
              ["Position Type", p.positionType],
              ["Custody", p.custody],
              ["Slippage Risk", p.slippageRisk],
              ["Exit Trigger", p.exitTrigger],
            ].map(([label, value]) => {
              const isSlippage = label === "Slippage Risk";
              const slippageColor = isSlippage ? (value === "HIGH" ? "#FF6B35" : "#00FFA3") : null;
              return (
                <div key={label} style={{ marginBottom: 9 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, marginBottom: 2 }}>
                    {label.toUpperCase()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: slippageColor || "rgba(255,255,255,0.65)",
                      lineHeight: 1.4,
                    }}>
                      {value}
                    </span>
                    {isSlippage && (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        color: slippageColor,
                        background: `${slippageColor}12`,
                        border: `1px solid ${slippageColor}25`,
                        borderRadius: 4,
                        padding: "2px 7px",
                        whiteSpace: "nowrap",
                      }}>
                        {p.slippageBps}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Position Sizing Table */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        POSITION SIZING — ALLOCATION TIERS
      </div>
      <div style={{ overflowX: "auto", marginBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "100px 60px 60px 60px 110px 1fr", gap: 0, minWidth: 580 }}>
          {["Tier", "SOL %", "MSTR %", "ZEC %", "Proj. Terminal", "Notes"].map((h) => (
            <div key={h} style={{
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: 1.2,
            }}>
              {h.toUpperCase()}
            </div>
          ))}
          {POSITION_SIZING.map((row) => {
            const BASE = 100000;
            const sol  = parseFloat(row.solPct)  / 100;
            const mstr = parseFloat(row.mstrPct) / 100;
            const zec  = parseFloat(row.zecPct)  / 100;
            const terminal = BASE * sol * 19.66 * mstr * 3.51 * zec * 33.7;
            return [row.tier, row.solPct, row.mstrPct, row.zecPct, formatCurrency(terminal), row.note].map((cell, j) => (
              <div key={`${row.tier}-${j}`} style={{
                padding: "12px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: row.isDefault ? "rgba(255,107,53,0.06)" : "transparent",
                fontFamily: j === 0 || j === 4 ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
                fontSize: j === 0 ? 11 : j === 4 ? 12 : 12,
                fontWeight: j === 4 ? 600 : undefined,
                color: j === 0
                  ? (row.isDefault ? "#FF6B35" : "rgba(255,255,255,0.7)")
                  : j === 1 ? "#00FFA3"
                  : j === 2 ? "#FF6B35"
                  : j === 3 ? "#F4B728"
                  : j === 4 ? "#F4B728"
                  : "rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                {cell}
                {j === 0 && row.isDefault && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: "#FF6B35", border: "1px solid #FF6B3540", borderRadius: 3, padding: "1px 4px" }}>
                    DEFAULT
                  </span>
                )}
              </div>
            ));
          })}
        </div>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 1, marginBottom: 36 }}>
        ASSUMES $100K ENTRY — FULL 3-PHASE ROTATION AT HISTORICAL MULTIPLES (19.66x · 3.51x · 33.7x)
      </div>

      {/* Order Execution Steps */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        ORDER EXECUTION — 6-STEP PROTOCOL
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 36 }}>
        {EXECUTION_STEPS.map((s, i) => {
          const isActive = activeStep === s.step;
          const isDone   = s.step < activeStep;
          return (
            <div key={s.step}
              role="button"
              tabIndex={0}
              onClick={() => setActiveStep(s.step)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveStep(s.step); } }}
              style={{ display: "flex", gap: 0, position: "relative", cursor: "pointer" }}>
              {/* Connector line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 16 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isActive ? "rgba(0,255,163,0.12)" : isDone ? "rgba(0,255,163,0.06)" : "rgba(255,255,255,0.04)",
                  border: isActive ? "1px solid rgba(0,255,163,0.5)" : isDone ? "1px solid rgba(0,255,163,0.25)" : "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: isActive ? "#00FFA3" : isDone ? "rgba(0,255,163,0.5)" : "rgba(255,255,255,0.5)",
                  flexShrink: 0,
                  zIndex: 1,
                  transition: "all 0.2s ease",
                }}>
                  {s.step}
                </div>
                {i < EXECUTION_STEPS.length - 1 && (
                  <div style={{ width: 1, flex: 1, background: isDone ? "rgba(0,255,163,0.2)" : "rgba(255,255,255,0.06)", minHeight: 20, margin: "4px 0", transition: "background 0.2s" }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: i < EXECUTION_STEPS.length - 1 ? 16 : 0 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: isActive ? "#fff" : "rgba(255,255,255,0.6)", marginBottom: 4, paddingTop: 4, transition: "color 0.2s" }}>
                  {s.title}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.6, color: isActive ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)", transition: "color 0.2s" }}>
                  {s.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Common Execution Failures */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 }}>
        COMMON EXECUTION FAILURES
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {EXECUTION_FAILURES.map((f, i) => (
          <div key={i} style={{
            background: "rgba(255,60,60,0.06)",
            border: "1px solid rgba(255,60,60,0.18)",
            borderRadius: 10,
            padding: "18px 20px",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,80,80,0.8)", letterSpacing: 1.2, marginBottom: 8 }}>
              ✗ {f.title}
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.58)", margin: 0 }}>
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { key: "overview",   label: "OVERVIEW"   },
  { key: "macro",      label: "MACRO"      },
  { key: "phases",     label: "PHASES"     },
  { key: "signals",    label: "SIGNALS"    },
  { key: "cycles",     label: "CYCLES"     },
  { key: "execution",  label: "EXECUTION"  },
  { key: "calculator", label: "CALCULATOR" },
  { key: "predict",    label: "2028"       },
  { key: "blackpaper", label: "BLACKPAPER" },
  { key: "conversion", label: "CONVERSION" },
];

function BlackpaperSection({ color, label, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      {label && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color || "rgba(255,255,255,0.3)", boxShadow: color ? `0 0 8px ${color}` : "none" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: color || "rgba(255,255,255,0.35)", letterSpacing: 2 }}>
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

function BlackpaperPara({ children, indent }) {
  return (
    <p style={{
      fontFamily: "'Source Serif 4', Georgia, serif",
      fontSize: 16,
      lineHeight: 1.9,
      color: "rgba(255,255,255,0.62)",
      margin: "0 0 18px",
      textIndent: indent ? 28 : 0,
    }}>
      {children}
    </p>
  );
}

function BlackpaperHeading({ children, sub }) {
  return (
    <div style={{ marginBottom: sub ? 10 : 20, marginTop: sub ? 28 : 44 }}>
      <h2 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: sub ? 20 : 26,
        fontWeight: 700,
        color: "#fff",
        margin: 0,
        lineHeight: 1.2,
      }}>
        {children}
      </h2>
      <div style={{ width: sub ? 30 : 50, height: 1, background: "rgba(255,255,255,0.12)", marginTop: 10 }} />
    </div>
  );
}

function BlackpaperQuote({ children, color }) {
  return (
    <div style={{
      borderLeft: `2px solid ${color || "rgba(255,255,255,0.15)"}`,
      paddingLeft: 20,
      margin: "24px 0",
    }}>
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: 17,
        lineHeight: 1.7,
        color: color || "rgba(255,255,255,0.5)",
        fontWeight: 500,
        fontStyle: "italic",
        margin: 0,
      }}>
        {children}
      </p>
    </div>
  );
}

function BlackpaperDatum({ label, value, color }) {
  return (
    <span style={{
      display: "inline-block",
      background: `${color || "rgba(255,255,255,0.1)"}12`,
      border: `1px solid ${color || "rgba(255,255,255,0.1)"}25`,
      borderRadius: 4,
      padding: "2px 8px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: color || "rgba(255,255,255,0.6)",
      margin: "0 2px",
    }}>
      {label && <span style={{ color: "rgba(255,255,255,0.3)", marginRight: 4 }}>{label}</span>}
      {value}
    </span>
  );
}

function Blackpaper() {
  const p = "#9D4EDD"; // TAO purple
  const t = "#23F0C6"; // XRP teal
  const y = "#F4B728"; // ZEC gold

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "10px 0 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 3, marginBottom: 14 }}>
          BLACKPAPER
        </div>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: "rgba(255,255,255,0.35)",
          margin: "0 auto",
          maxWidth: 480,
          lineHeight: 1.6,
        }}>
          How $100,000 became $660,800,000 in nineteen months — a chronicle of three infrastructure layers, one halving, and the discipline to see it through.
        </p>
        <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.1)", margin: "24px auto 0" }} />
      </div>

      <BlackpaperSection label="I" color="rgba(255,255,255,0.4)">
        <BlackpaperHeading>Three Layers</BlackpaperHeading>
        <BlackpaperPara>
          Every technology revolution organizes itself in layers. The internet had infrastructure (fiber, routers), then platforms (AWS, Google),
          then applications (everything you actually use). The financial revolution built on blockchain is no different.
          There is a compute layer. A settlement layer. And a privacy layer.
        </BlackpaperPara>
        <BlackpaperPara indent>
          What makes cryptocurrency unique — and uniquely dangerous — is that each layer does not merely appreciate during bull markets.
          It <em style={{ color: "rgba(255,255,255,0.8)" }}>explodes</em>. And the explosions do not happen simultaneously.
          They happen in sequence, separated by months, each one triggered by its own distinct catalyst, each one attracting a different
          type of capital. If you understand the sequence, you can ride all three.
        </BlackpaperPara>
        <BlackpaperPara indent>
          This document is not a prediction. It is a chronicle. Between October 2023 and May 2026, three assets occupied the compute,
          settlement, and privacy layers of a cryptocurrency supercycle — and executed exactly as their structural positions predicted.
          Bittensor (TAO) led. Ripple (XRP) followed. Zcash (ZEC) closed.
        </BlackpaperPara>
        <BlackpaperQuote color={p}>
          The question is never "which asset?" The question is "which layer is next, and is it compressed enough to explode?"
        </BlackpaperQuote>
        <BlackpaperPara indent>
          The entry into each layer was not a guess. It was a read: on supply dynamics, on regulatory timelines, on narrative maturity.
          The exit from each layer was equally deliberate: a recognition that the expansion had run its course and that the next layer
          was ready to ignite. Capital does not rest between rotations. It moves. Immediately. Without sentiment.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="II" color="rgba(255,255,255,0.4)">
        <BlackpaperHeading>The Clock</BlackpaperHeading>
        <BlackpaperPara>
          On April 19, 2024, at block height 840,000, the Bitcoin network executed something it had done three times before
          and will do again in 2028: it cut its per-block mining reward in half. Six point two five BTC became three point one two five.
          The fourth halving. The most anticipated supply shock in the history of financial markets.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The halving matters not because of what it does to miners. It matters because of what it does to psychology.
          In the months before a halving, retail capital floods into the ecosystem, front-running the narrative.
          In the months after, institutional capital — slower, more methodical, waiting for confirmation — begins to deploy.
          And in the late cycle, exhausted by Bitcoin's parabolic run, speculative capital hunts for the final trade:
          the illiquid, forgotten asset that nobody is watching.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The Supercycle used April 19, 2024 as its temporal anchor — not its starting point.
          The first phase was already over before the halving arrived. The clock had been running for six months.
        </BlackpaperPara>
        <BlackpaperQuote color="rgba(255,255,255,0.4)">
          The halving does not start the cycle. It divides it. Everything before is anticipation. Everything after is confirmation.
        </BlackpaperQuote>
        <BlackpaperPara indent>
          Understanding this distinction is the difference between 15x returns and watching from the sidelines.
          By the time Bitcoin's supply shock makes the front page of the Wall Street Journal, the vanguard phase is already complete.
          The newspaper is not an entry signal. It is an exit signal.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="PHASE 1" color={p}>
        <BlackpaperHeading>AI Discovers Money</BlackpaperHeading>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: p, fontWeight: 700, marginBottom: 20, letterSpacing: -0.5 }}>
          Bittensor (TAO)
        </div>
        <BlackpaperPara>
          October 2023. The crypto market is quiet in the way only a market that has recently suffered catastrophically can be quiet.
          FTX collapsed eleven months prior. Three Arrows Capital: gone. Luna: ash. Celsius: in bankruptcy.
          Bitcoin is grinding sideways between $26,000 and $35,000, slowly healing, not yet exciting.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Into this depleted landscape: Bittensor, trading at{" "}
          <BlackpaperDatum value="$46.44" color={p} /> on a handful of small exchanges. Most people have never heard of it.
          It is a protocol that rewards validators for producing machine learning model outputs — a decentralized marketplace
          where nodes compete to train and serve AI inference, earning TAO tokens in proportion to the quality of their outputs.
          The token economics are ruthless: outperform your peers or earn nothing. The network self-selects for capability.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Nobody cares. Until the AI narrative ignites everything around it.
        </BlackpaperPara>
        <BlackpaperQuote color={p}>
          ChatGPT crosses 100 million users. The GPU shortage becomes national news. Congress holds hearings on artificial intelligence.
          Microsoft announces Copilot at $30 per month for every Office 365 user on the planet.
          And retail crypto traders, hunting for "the Bitcoin of AI," discover Bittensor.
        </BlackpaperQuote>
        <BlackpaperPara indent>
          The TAO move is not slow. October to March: five months of violent price discovery as the AI narrative crescendoes
          and retail capital pours into the only decentralized AI infrastructure protocol with real validator economics.
          The terminal peak arrives on March 8, 2024 — exactly one month before the halving — at{" "}
          <BlackpaperDatum value="$699.94" color={p} />.
        </BlackpaperPara>
        <BlackpaperPara indent>
          This timing is not accidental. Retail traders operate on anticipation. They don't wait for the halving to confirm —
          they front-run it. By the time the block reward actually halves, the vanguard move is complete.
          The smart capital is already out. The newspapers are writing about TAO when the exit is already done.
        </BlackpaperPara>
        <BlackpaperPara indent>
          $100,000 deployed on October 19, 2023. Liquidated on March 8, 2024. Portfolio:{" "}
          <BlackpaperDatum value="$1,500,000" color={p} />. A{" "}
          <span style={{ color: p, fontWeight: 700 }}>15x</span> return in 140 days.
          The compute layer has spoken. The capital rotates.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="INTERLUDE" color="rgba(255,255,255,0.2)">
        <BlackpaperHeading sub>The Waiting Room</BlackpaperHeading>
        <BlackpaperPara>
          March 8, 2024. The TAO position is liquidated. The portfolio sits at $1.5 million in cash.
          The Bitcoin halving is six weeks away. The market is noisy with anticipation.
          And the next position — XRP — is not ready.
        </BlackpaperPara>
        <BlackpaperPara indent>
          This is the moment that separates practitioners from tourists. The tourist sees $1.5 million sitting idle
          and feels compelled to deploy it. Into Bitcoin. Into Ethereum. Into whatever is trending.
          The practitioner understands that idle capital between phases is not a problem to solve — it is a feature.
          It means you are between waves, dry, patient, waiting for the next compression to reveal itself.
        </BlackpaperPara>
        <BlackpaperPara indent>
          XRP in the spring of 2024 is not yet ready. The SEC lawsuit — filed December 2020 — has dragged into its fourth year.
          Institutional capital cannot touch an asset under active securities litigation. The regulatory overhang is total.
          But the overhang is also finite. Court calendars have a logic of their own. And by mid-2024, the logic is resolving.
        </BlackpaperPara>
        <BlackpaperQuote color="rgba(255,255,255,0.3)">
          The edge in rotation trading is not cleverness. It is patience.
          Most traders cannot hold cash for six months. That inability is your alpha.
        </BlackpaperQuote>
      </BlackpaperSection>

      <BlackpaperSection label="PHASE 2" color={t}>
        <BlackpaperHeading>The Institution Arrives</BlackpaperHeading>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: t, fontWeight: 700, marginBottom: 20, letterSpacing: -0.5 }}>
          Ripple (XRP)
        </div>
        <BlackpaperPara>
          Ripple is not a cryptocurrency company in the way most crypto companies are cryptocurrency companies.
          It is, at its core, a payments infrastructure business that issued a token. The Ripple network —
          specifically its On-Demand Liquidity corridors — had been quietly processing billions in cross-border remittances
          for years: Mexico to the Philippines, the UK to South Africa, the UAE to India.
          Banks were using it. Settlement desks were using it. The rails existed and were functioning.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The problem was not the product. The problem was the lawsuit. In December 2020, the SEC filed a complaint
          alleging that XRP was an unregistered security. Every major US exchange delisted it within weeks.
          Institutional capital, which had been quietly accumulating, evaporated. XRP spent four years in regulatory purgatory,
          trading on rumor, surviving on the conviction of its holder base, waiting for a court to say what it was.
        </BlackpaperPara>
        <BlackpaperPara indent>
          On August 7, 2024, the SEC filed a notice of intent to settle. The market read between the lines immediately.
          The war was ending. And when the war ends, four years of suppressed institutional demand — pension allocators,
          sovereign wealth funds, settlement desks that had watched from the sidelines — begins to price in simultaneously.
        </BlackpaperPara>
        <BlackpaperQuote color={t}>
          Regulatory clarity is not a tailwind. It is a dam breaking. Four years of institutional demand
          compressed into a single unlocking event — and every dollar arrives at once.
        </BlackpaperQuote>
        <BlackpaperPara indent>
          October 2, 2024: XRP at{" "}
          <BlackpaperDatum value="$0.5241" color={t} />. The $1.5 million enters.
          Over the next 98 days, as regulatory clarity crystallized and institutional adoption accelerated
          across Ripple's Asia-Pacific and Latin American corridors, XRP repriced.
          January 8, 2025: <BlackpaperDatum value="$3.14" color={t} />.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Six times the entry. Three months. The settlement layer's moment has arrived and passed.
          The portfolio now stands at <BlackpaperDatum value="$9,000,000" color={t} />.
          The signal to exit is institutional premium exhaustion — XRP has repriced to fair value
          and the marginal buyer is now retail, not institutional. That is the top.
          The capital rotates again. This time into the final layer.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="PHASE 3" color={y}>
        <BlackpaperHeading>The Privacy Detonation</BlackpaperHeading>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: y, fontWeight: 700, marginBottom: 20, letterSpacing: -0.5 }}>
          Zcash (ZEC) — The Blow-Off
        </div>
        <BlackpaperPara>
          By spring 2025, the world has changed in ways that make Zcash suddenly, urgently relevant.
          The Federal Reserve's Project Cedar — the US digital dollar pilot — has entered its third phase.
          The EU's digital euro has rolled out across Germany, Austria, and France. China's e-CNY is being considered
          for BRICS cross-border trade settlement. Every major central bank on earth is building a surveillance currency.
        </BlackpaperPara>
        <BlackpaperPara indent>
          A CBDC is not a digital payment system. It is a financial identity system.
          Every transaction recorded. Every merchant registered. Every wallet KYC'd.
          The programmable money that governments are building can expire, can be restricted by category,
          can be frozen without a court order, can be surveilled without a warrant.
          The era of private, permissionless value transfer — the original premise of cryptocurrency — is being dismantled.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Into this moment: Zcash, at{" "}
          <BlackpaperDatum value="$31.17" color={y} /> on April 9, 2025.
          Launched in October 2016, Zcash implemented zk-SNARKs — zero-knowledge proofs that verify transactions
          without revealing sender, receiver, or amount. Not private in the "we promise we won't look" sense.
          Private in the "it is mathematically impossible to determine" sense. The only cryptocurrency
          that offers genuine, cryptographically enforced financial anonymity at the base protocol layer.
        </BlackpaperPara>
        <BlackpaperQuote color={y}>
          The founders' reward — four years of forced selling — has ended. The November 2024 ZEC halving
          cut supply issuance by 50%. Order books, hollowed by years of regulatory delistings, are paper-thin.
          The asset is maximally compressed. The narrative is maximally relevant. The match is struck.
        </BlackpaperQuote>
        <BlackpaperPara indent>
          The $9 million enters at $31.17. What follows is not a rally — it is a detonation.
          Seven months of sustained vertical price discovery as privacy becomes the defining political narrative of 2025.
          Every CBDC announcement is ZEC rocket fuel. Every surveillance hearing in Congress amplifies the bid.
          On November 12, 2025, ZEC reaches <BlackpaperDatum value="$674.00" color={y} />.
        </BlackpaperPara>
        <BlackpaperPara indent>
          <span style={{ color: y, fontWeight: 700 }}>21.6x</span>. Seven months. $9 million becomes{" "}
          <BlackpaperDatum value="$194,400,000" color={y} />. Take every dollar off the table.
          The blow-off is complete. The privacy narrative has reached maximum mainstream saturation.
          The next move for ZEC is not up. It is down — significantly, temporarily, and with mathematical precision.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="PHASE 4" color={y}>
        <BlackpaperHeading>The Discipline Trade</BlackpaperHeading>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: y, fontWeight: 700, marginBottom: 20, letterSpacing: -0.5 }}>
          Zcash (ZEC) — The Swing Trade
        </div>
        <BlackpaperPara>
          $674 to $197.82. November 2025 to March 2026. A 71% drawdown over three and a half months.
          For the ninety-five percent of participants who experience this as spectators — watching from the sidelines
          or holding through the decline — it is a catastrophe. A collapse. Evidence that the trade is over.
        </BlackpaperPara>
        <BlackpaperPara indent>
          It is none of those things. It is a retracement. And it is an opportunity.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The error that costs most people Phase 4 is the conflation of "price went down" with "thesis is broken."
          The thesis was: CBDCs are real, privacy is politically urgent, ZEC supply is compressed, order books are thin.
          On March 7, 2026, every one of these conditions remains true. The CBDCs are still deploying.
          The privacy legislation is still failing. The order books are still thin.
          What happened between November and March was profit-taking. Deleveraging. A market digesting a 21.6x move
          in the only way it knows how: by correcting exactly as far as the technical structure demands.
        </BlackpaperPara>
        <BlackpaperQuote color={y}>
          The retracement does not invalidate the narrative. It resets the entry.
          $197.82 is not ZEC failing. It is ZEC offering a second chance to those disciplined enough to take it.
        </BlackpaperQuote>
        <BlackpaperPara indent>
          March 7, 2026: <BlackpaperDatum value="$197.82" color={y} />. The full $194.4 million re-enters.
          Every dollar from the Phase 3 exit goes back in at the retracement low. The swing trade is textbook:
          narrative intact, supply compressed, technical structure setting up a second push, institutional holders
          who exited at the top beginning to rebuild positions.
        </BlackpaperPara>
        <BlackpaperPara indent>
          May 19, 2026: ZEC reaches <BlackpaperDatum value="$673.46" color={y} /> — within a dollar of the Wave 1 peak.
          The second pump nearly matches the first. The privacy narrative sustains. The order books amplify.
          The exit is total and immediate: everything to fiat, no residual position, no "let it ride."
        </BlackpaperPara>
        <BlackpaperPara indent>
          <span style={{ color: y, fontWeight: 700 }}>3.4x</span> on the swing. $194.4 million becomes{" "}
          <BlackpaperDatum value="$660,800,000" color={y} />.
          The Supercycle is complete.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="V" color="rgba(255,60,60,0.6)">
        <BlackpaperHeading>The Exit Is Not Optional</BlackpaperHeading>
        <BlackpaperPara>
          ZEC's vertical rallies have a history. Each one has ended the same way — not with a slow decline,
          but with the kind of precipitous collapse that erases gains in days rather than months.
          The pattern across three cycles is merciless:
        </BlackpaperPara>
        <div style={{ margin: "20px 0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { date: "January 2018", detail: "ZEC surged to $700+ on privacy narrative", after: "Collapsed 93% over the following year. The 2018 crypto winter began within weeks." },
            { date: "May 2021", detail: "ZEC spiked to $386 as DeFi privacy demand peaked", after: "Fell 85% in six months as the broader market liquidated." },
            { date: "November 2025", detail: "ZEC reached $674 on CBDC surveillance narrative", after: "Retraced 71% to $197.82 before the Phase 4 swing trade entry." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,60,60,0.5)", minWidth: 110, flexShrink: 0 }}>
                {item.date}
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{item.detail}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{item.after}</div>
              </div>
            </div>
          ))}
        </div>
        <BlackpaperPara indent>
          The Phase 4 exit on May 19, 2026 is not a suggestion. It is the terminus. The Supercycle framework permits
          no further rotations into digital assets after the ZEC Wave 2 exit. The capital moves to fiat, to treasuries,
          to risk-free instruments — and it stays there while the inevitable 70–90% cyclical drawdown runs its course.
          The practitioner who holds past the exit point does not merely fail to compound their gains. They risk returning
          all of them. The bear market does not negotiate with those who overstay.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="VI" color="rgba(255,255,255,0.4)">
        <BlackpaperHeading>The Rotational Matrix</BlackpaperHeading>
        <BlackpaperPara>
          Reduced to its essential form: four entries, four exits, nineteen months, and a single rule
          governing each transition — move when the expansion is ending, not after it ends.
        </BlackpaperPara>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", margin: "24px 0" }}>
          {[
            { phase: "1", asset: "TAO", entry: "Oct 19, 2023", exit: "Mar 8, 2024", mult: "15x", capital: "$1.50M", color: p },
            { phase: "2", asset: "XRP", entry: "Oct 2, 2024", exit: "Jan 8, 2025", mult: "6x", capital: "$9.00M", color: t },
            { phase: "3", asset: "ZEC W1", entry: "Apr 9, 2025", exit: "Nov 12, 2025", mult: "21.6x", capital: "$194.4M", color: y },
            { phase: "4", asset: "ZEC W2", entry: "Mar 7, 2026", exit: "May 19, 2026", mult: "3.4x", capital: "$660.8M", color: y },
          ].map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "50px 80px 110px 110px 70px 100px", padding: "12px 16px", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>P{row.phase}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: row.color, fontWeight: 600 }}>{row.asset}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{row.entry}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{row.exit}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: row.color }}>{row.mult}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{row.capital}</span>
            </div>
          ))}
        </div>
        <BlackpaperPara indent>
          The specific assets in this matrix — TAO, XRP, ZEC — are not the point. They were the right instruments
          for this particular cycle because they occupied the right structural positions at the right moments.
          The next cycle will have different assets in these roles. The archetypes will not change.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Before every halving, ask: which asset is front-running it on retail narrative?
          Post-halving, ask: which asset has institutional demand that regulatory or macro clarity will unlock?
          Late cycle, ask: which asset sits at maximum supply compression with a narrative that has not yet reached mainstream consciousness?
        </BlackpaperPara>
        <BlackpaperPara indent>
          Find those three. Execute the rotation. Do not deviate. The clock is already ticking toward 2028.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="VII" color="rgba(255,255,255,0.4)">
        <BlackpaperHeading>The Psychology of $194 Million Going to $197</BlackpaperHeading>
        <BlackpaperPara>
          The hardest moment in the Supercycle is not the TAO entry at $46. It is not the XRP entry at $0.5241.
          It is not even the ZEC entry at $31.17. The hardest moment is March 7, 2026 — the day you take
          $194.4 million and deploy it back into an asset that just lost 71% of its value.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Every instinct rebels. The asset "crashed." The narrative "failed." Everyone who held through the decline
          is exhausted and underwater relative to the peak. The financial media has moved on to the next story.
          ZEC is no longer on anyone's radar. And that is precisely why the setup is perfect.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The edge in Phase 4 is not analytical. The analysis is simple — the thesis is intact, the supply is compressed,
          the order books are still thin, the re-entry is 71% below the prior peak. The edge is psychological:
          the ability to act on that analysis while $194 million in capital and the weight of nineteen months
          of accumulated gains sits between you and the decision.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Most practitioners would not take Phase 4. They would preserve Phase 3 gains, call it a win,
          and walk away with $194 million. That is a rational choice. It is not the optimal one.
          The Supercycle framework demands the retracement trade because the mathematics of 3.4x on $194 million —
          an additional $466 million extracted from a second wave — are too significant to leave on the table
          if the narrative confirms. And it confirmed.
        </BlackpaperPara>
        <BlackpaperPara indent>
          There is also the matter of execution scale. $194 million entering ZEC's thin order books at a single moment
          would cause catastrophic slippage on entry and equal destruction on exit. Positions at this scale are built
          and unwound algorithmically — via TWAP strategies spread across weeks, not minutes. The exit is never a single trade.
          It is a campaign.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection>
        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0 36px" }} />
        <BlackpaperPara>
          Nineteen months. Four phases. One hundred thousand dollars.
          The compute layer front-ran the halving on AI narrative and delivered 15x.
          The settlement layer unlocked on regulatory clarity and delivered 6x.
          The privacy layer detonated on CBDC anxiety and delivered 21.6x.
          The discipline trade — the retracement swing — delivered a final 3.4x on the full stack.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Six hundred and sixty million dollars. Not from a single bet on a single asset.
          From understanding that liquidity has a shape — that it moves through infrastructure layers in sequence,
          that each layer has its moment and then yields to the next, and that the practitioner's job
          is simply to be standing in the right place when each wave breaks.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The Supercycle is over. The next one is already being priced in.
          The clock ticks toward 2028. The layers are forming.
          The question is only whether you will recognize them in time.
        </BlackpaperPara>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <div style={{ display: "inline-block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: 3 }}>
            — END —
          </div>
        </div>
      </BlackpaperSection>
    </div>
  );
}

const CONVERSION_PHASES = [
  { id: "I", label: "JURISDICTIONAL ENGINEERING", color: "#00FFA3", summary: "Sever domicile from high-tax states and establish residency in a zero-income-tax jurisdiction before the liquidation event." },
  { id: "II", label: "FIDUCIARY ARCHITECTURE", color: "#6450FF", summary: "Structure capital within Domestic Asset Protection Trusts and establish a Single-Family Office with Private Trust Company governance." },
  { id: "III", label: "INSTITUTIONAL LIQUIDATION", color: "#FF6B35", summary: "Execute nine-figure liquidation via institutional OTC desks with locked quotes, bypassing public order books entirely." },
  { id: "IV", label: "CAPITAL PRESERVATION", color: "#F4B728", summary: "Neutralize counterparty banking risk via FDIC sweep networks and deploy into ultra-low-risk preservation instruments." },
  { id: "V", label: "TREASURY & RE-ENTRY", color: "#00B4FF", summary: "Generate risk-free yield via Treasury ladders, maintain liquidity through SBLOCs, and execute rules-based re-entry into subsequent cycles." },
];

const CONVERSION_STATES = [
  { state: "Nevada", rate: "0%", test: "Domicile / 30-day presence", protections: "Homestead exemption, strongest asset protection trusts, no exception creditors", notes: "Fastest DAPT seasoning (2yr). Explicitly exempts crypto from property tax. Optimal for UHNW." },
  { state: "Texas", rate: "0%", test: "Domicile / 183-day rule", protections: "Homestead exemption (unlimited acreage outside city)", notes: "Business-friendly, vehicle inspection required. Strong for operational SFO base." },
  { state: "Wyoming", rate: "0%", test: "Domicile / minimal", protections: "Privacy protections, SPDI charter for crypto banking", notes: "1,000-year trust duration. Lowest LLC fees. Pro-crypto banking laws (SPDI charter)." },
  { state: "Florida", rate: "0%", test: "Domicile / straightforward", protections: "Homestead exemption (unlimited value), asset protection", notes: "No annual vehicle inspection. Straightforward domicile process. Strong case law." },
];

const DAPT_JURISDICTIONS = [
  { jurisdiction: "Nevada", statute: "2 Years", exceptionCreditors: "None", stateTax: "0%", advantage: "Fastest seasoning period. Zero exception creditors. Explicitly exempts crypto from property tax." },
  { jurisdiction: "South Dakota", statute: "2 Years", exceptionCreditors: "Few", stateTax: "0%", advantage: "Highest privacy standards. Permanent seal on trust litigation. Excellent for quiet wealth." },
  { jurisdiction: "Wyoming", statute: "4 Years", exceptionCreditors: "Few", stateTax: "0%", advantage: "1,000-year trust duration. Low LLC integration fees. Pro-crypto SPDI banking laws." },
  { jurisdiction: "Delaware", statute: "4 Years", exceptionCreditors: "Yes (Alimony, Support)", stateTax: "0% (trust income)", advantage: "Established Chancery Court system. Highly predictable legal outcomes." },
];

const SFO_PTC_DOMAINS = [
  { domain: "Primary Mandate", sfo: "Wealth multiplication, tax strategy, asset allocation, and lifestyle management.", ptc: "Fiduciary governance, legal trust compliance, and intergenerational transfer mechanisms.", synergy: "Complete alignment of agile investment operations with strict legal trust mandates." },
  { domain: "Regulatory Status", sfo: "Generally unregulated; exempt from Investment Advisers Act registration.", ptc: "Regulated fiduciary entity operating under specific state banking or trust laws.", synergy: "Combines rapid operational agility with formidable legal defensibility." },
  { domain: "Control Dynamics", sfo: "Directed by family principals and hired executives (CIO, CFO).", ptc: "Directed by a formal board of directors, which can legally include family members.", synergy: "Family retains active control over trust assets without piercing the legal liability veil." },
];

const OTC_DESKS = [
  { desk: "Coinbase Prime", minTrade: "$1M+", regulatory: "NY Trust Charter, SEC, FINRA", strength: "Regulated custody integration. Seamless fiat off-ramp. Institutional-grade compliance." },
  { desk: "FalconX", minTrade: "$1M+", regulatory: "CFTC Swap Dealer, EU VFA (Malta)", strength: "Unified margin accounts (no pre-funding). Deep liquidity across 200+ pairs." },
  { desk: "Galaxy Digital", minTrade: "$1M+", regulatory: "SEC, FINRA (publicly traded)", strength: "Principal desk using own balance sheet. OTC proceeds deployable into yield programs." },
  { desk: "Wintermute", minTrade: "$500K+", regulatory: "Global compliance", strength: "Algorithmic principal dealer. 24/7 trading. Extremely tight spreads on majors." },
  { desk: "Cumberland (DRW)", minTrade: "$1M+", regulatory: "SEC, FINRA", strength: "Backed by DRW's institutional trading infrastructure. Deep BTC/ETH liquidity." },
];

const CUSTODIANS = [
  { name: "Kraken Bank (WY)", detail: "SPDI charter. Bridges digital asset liquidation to institutional fiat custody." },
  { name: "BNY Mellon", detail: "World's largest custodian bank. Active digital assets division for institutional clients." },
  { name: "Anchorage Digital", detail: "OCC-chartered national trust bank. SOC 2 Type II. Federal regulatory framework." },
  { name: "Fidelity Digital Assets", detail: "Backed by Fidelity Investments. Cold-storage custody with institutional insurance." },
  { name: "Northern Trust", detail: "Institutional-grade crypto custody integrated with traditional wealth management." },
];

const PRESERVATION_INSTRUMENTS = [
  { instrument: "Short-Term U.S. Treasury Bills", annReturn: "4.0–5.5%", maxDrawdown: "Near-zero", liquidity: "T+0 to T+1", protection: "U.S. government backing", notes: "Lowest risk. Exempt from state/local tax. 4-week to 1-year maturities." },
  { instrument: "Government Money Market Funds", annReturn: "4.0–5.2%", maxDrawdown: "Low", liquidity: "T+0 to T+1", protection: "SIPC up to $500K", notes: "Stable $1 NAV. Slightly higher yield than savings. Daily liquidity." },
  { instrument: "FDIC-Insured Cash Sweeps (ICS)", annReturn: "3.5–4.5%", maxDrawdown: "Near-zero", liquidity: "T+0", protection: "FDIC up to $250K per bank", notes: "Auto-fragments across 1000s of banks. Single statement. Full FDIC on entire balance." },
];

const ALLOCATION_SHIFT = [
  { asset: "Public Equities", prevGen: "45–50%", nextGen: "30–35%", rationale: "Shift from correlated public markets to illiquid private markets for illiquidity premium and higher alpha." },
  { asset: "Private Equity / VC", prevGen: "25–30%", nextGen: "30–35%", rationale: "Preference for operational control, direct investments, and long-term tax-deferred compounding." },
  { asset: "Digital Assets / Crypto", prevGen: "< 10%", nextGen: "10–15%", rationale: "Core portfolio pillar — actively managed via hedge funds or direct custody as store of value and growth engine." },
  { asset: "Fixed Income / Cash", prevGen: "10–15%", nextGen: "5–8%", rationale: "Conservative buffers minimized. Yield sought via private credit rather than standard bonds." },
];

const REENTRY_CHECKLIST = [
  { label: "Dry Powder Reserve", detail: "Maintain 10–20% of proceeds in stable assets (USD, USDC). Ensures liquidity for opportunistic buys, taxes, or emergencies." },
  { label: "Staged Re-Entry Ladder", detail: "Deploy capital in tranches at predetermined drawdown levels — e.g., 25% at 60% market drop, 25% at 70%, 25% at 80%. Buys at progressively cheaper prices." },
  { label: "Rules-Based Allocation", detail: "No single crypto > 30% of portfolio. No ecosystem > 15%. Cap speculative tokens. Avoid projects with audit failures or key-person risks." },
  { label: "DCA Automation", detail: "Automate dollar-cost averaging for core assets during accumulation phases. Remove emotional decision-making from systematic re-entry." },
  { label: "Quarterly Review Cadence", detail: "Audit allocation drift, reassess counterparty risks, review market signals, update watchlists. Maintain documented what-if scenarios and emergency procedures." },
];

function ConversionTab() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 8 }}>
          POST-CYCLE CONVERSION — WEALTH PRESERVATION ARCHITECTURE
        </div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          margin: "0 0 12px",
          lineHeight: 1.2,
          background: "linear-gradient(135deg, #00FFA3, #6450FF, #00B4FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Strategic Wealth Preservation
        </h2>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.55)", margin: 0, maxWidth: 720 }}>
          The realization of a highly appreciated cryptocurrency portfolio at the apex of a projected market cycle presents a multifaceted financial, legal, and operational challenge. At this echelon of wealth, traditional retail banking frameworks are fundamentally inadequate. The transition of nine-figure digital asset wealth into preserved, liquid, and tax-optimized fiat currency requires an institutional-grade architecture — executed simultaneously across jurisdictional, fiduciary, and operational domains.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 12,
        marginBottom: 40,
      }}>
        {CONVERSION_PHASES.map((phase) => (
          <div key={phase.id} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "18px 20px",
            borderLeft: `3px solid ${phase.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <GlowDot color={phase.color} size={6} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: phase.color, letterSpacing: 1.5 }}>
                PHASE {phase.id}
              </span>
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
              {phase.label}
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.45)", margin: 0 }}>
              {phase.summary}
            </p>
          </div>
        ))}
      </div>

      {/* PHASE I: JURISDICTIONAL ENGINEERING */}
      <BlackpaperSection color="#00FFA3" label="PHASE I — JURISDICTIONAL ENGINEERING & DOMICILE SEVERANCE">
        <BlackpaperHeading>Tax-Optimal Domicile Selection</BlackpaperHeading>
        <BlackpaperPara>
          The geographic location of an individual at the exact moment a highly appreciated asset is liquidated dictates the baseline erosion of that capital. Under both federal IRS guidelines and state-level tax codes, cryptocurrency is treated as <span style={{ color: "#00FFA3" }}>intangible personal property</span>. The gain realized from its sale is sourced to the taxpayer's state of residence at the time of the sale. For a $232 million liquidation in a state like California (13.3% top rate), the state tax liability alone would exceed $30 million.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The foundational step in wealth preservation is the legal and absolute severance of domicile from a high-tax state and the establishment of residency in a zero-income-tax jurisdiction. This must be completed well before the 2029 cycle peak — not during it. A mere change of driver's license or voter registration is catastrophically insufficient. Courts have repeatedly upheld tax agency determinations against taxpayers who failed to genuinely sever economic, social, and physical ties.
        </BlackpaperPara>

        <BlackpaperHeading sub>Zero-Tax State Comparison</BlackpaperHeading>
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 50px 1fr 1fr 1fr", gap: 0, minWidth: 700 }}>
            {["State", "Rate", "Residency Test", "Key Protections", "Notes"].map((h) => (
              <div key={h} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.2 }}>
                {h.toUpperCase()}
              </div>
            ))}
            {CONVERSION_STATES.map((s) => (
              [s.state, s.rate, s.test, s.protections, s.notes].map((val, i) => (
                <div key={`${s.state}-${i}`} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: i === 0 ? "#fff" : i === 1 ? "#00FFA3" : "rgba(255,255,255,0.5)", lineHeight: 1.5, background: i === 1 ? "rgba(0,255,163,0.04)" : "transparent" }}>
                  {i === 0 ? <span style={{ fontWeight: 600 }}>{val}</span> : val}
                </div>
              ))
            ))}
          </div>
        </div>

        <div style={{
          padding: "16px 18px",
          background: "rgba(255,60,60,0.05)",
          border: "1px solid rgba(255,60,60,0.1)",
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,60,60,0.6)", letterSpacing: 1.5, marginBottom: 8 }}>
            AUDIT RISK — CALIFORNIA FTB & NEW YORK DTF
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>California</strong> utilizes a subjective "facts-and-circumstances" test — not a strict 183-day rule. The FTB will subpoena cell phone tower pings, ATM withdrawals, credit card locations, and EZ-Pass data. The burden of proof rests entirely on the taxpayer.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>New York</strong> enforces strict statutory residency: maintaining a "permanent place of abode" for &gt;10 months combined with 184+ days triggers full residency taxation — even if domicile was legally changed.
          </p>
        </div>

        <div style={{
          padding: "14px 18px",
          background: "rgba(0,255,163,0.03)",
          border: "1px solid rgba(0,255,163,0.08)",
          borderRadius: 8,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(0,255,163,0.5)", letterSpacing: 1.5, marginBottom: 6 }}>
            CRITICAL TIMELINE
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Domicile severance must be surgically complete <strong style={{ color: "#00FFA3" }}>12–24 months before</strong> the liquidation event. Physical relocation, property sale in the former state, purchase of primary residence in the new state, migration of banking/professional services, and meticulous presence tracking are all required to survive an audit.
          </p>
        </div>
      </BlackpaperSection>

      {/* PHASE II: FIDUCIARY ARCHITECTURE */}
      <BlackpaperSection color="#6450FF" label="PHASE II — FIDUCIARY ARCHITECTURE & ASSET PROTECTION">
        <BlackpaperHeading>Beyond the LLC Fortress Fallacy</BlackpaperHeading>

        <div style={{
          padding: "16px 18px",
          background: "rgba(255,60,60,0.05)",
          border: "1px solid rgba(255,60,60,0.1)",
          borderRadius: 8,
          marginBottom: 24,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,60,60,0.6)", letterSpacing: 1.5, marginBottom: 8 }}>
            THE LLC FORTRESS FALLACY
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            The belief that a Wyoming single-member LLC provides absolute protection is a dangerous misconception. In <em>Olmstead v. FTC</em>, the Florida Supreme Court demonstrated that courts can pierce single-member LLC protections, bypassing charging orders entirely to compel surrender of the underlying membership interest. True institutional-grade protection requires the absolute bifurcation of legal ownership from beneficial enjoyment via an <span style={{ color: "#6450FF" }}>irrevocable trust</span>.
          </p>
        </div>

        <BlackpaperPara>
          To construct an impenetrable firewall around the capital, assets must be structured within a Domestic Asset Protection Trust (DAPT). Among the 17 U.S. states permitting DAPTs, Nevada dominates for three reasons: an aggressively short 2-year statute of limitations, zero exception creditors (ensuring seasoned assets are shielded from all civil litigation), and explicit exemption of cryptocurrencies from taxation as intangible personal property.
        </BlackpaperPara>

        <BlackpaperHeading sub>DAPT Jurisdiction Comparison</BlackpaperHeading>
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 80px 1fr 80px 1fr", gap: 0, minWidth: 700 }}>
            {["Jurisdiction", "Statute", "Exception Creditors", "State Tax", "Strategic Advantage"].map((h) => (
              <div key={h} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.2 }}>
                {h.toUpperCase()}
              </div>
            ))}
            {DAPT_JURISDICTIONS.map((d) => (
              [d.jurisdiction, d.statute, d.exceptionCreditors, d.stateTax, d.advantage].map((val, i) => (
                <div key={`${d.jurisdiction}-${i}`} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.5, background: i === 1 && val === "2 Years" ? "rgba(100,80,255,0.05)" : "transparent" }}>
                  {i === 0 ? <span style={{ fontWeight: 600 }}>{val}</span> : val}
                </div>
              ))
            ))}
          </div>
        </div>

        <div style={{
          padding: "14px 18px",
          background: "rgba(100,80,255,0.04)",
          border: "1px solid rgba(100,80,255,0.1)",
          borderRadius: 8,
          marginBottom: 28,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(100,80,255,0.6)", letterSpacing: 1.5, marginBottom: 6 }}>
            ESTATE TAX EXEMPTION SUNSET
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Transfer crypto <strong style={{ color: "#6450FF" }}>in-kind during bear market troughs</strong> to consume minimal lifetime exemption ($13.99M per individual in 2025, reverting to ~$7M in 2026). All subsequent appreciation to $232M occurs inside the trust — permanently excluded from the taxable estate, neutralizing the 40% federal estate tax. An Intentionally Defective Grantor Trust (IDGT) structure allows the grantor to pay income taxes from personal assets, enabling the trust principal to compound tax-free.
          </p>
        </div>

        <BlackpaperHeading sub>Single-Family Office + Private Trust Company</BlackpaperHeading>
        <BlackpaperPara indent>
          A liquid net worth approaching a quarter-billion dollars warrants a dedicated Single-Family Office (SFO) paired with a Private Trust Company (PTC). The SFO handles execution and research; the PTC handles legal authorization and fiduciary oversight. This dual structure allows the family to actively participate in governance without compromising the trust's spendthrift protections.
        </BlackpaperPara>

        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr", gap: 0, minWidth: 600 }}>
            {["Domain", "SFO Role", "PTC Role", "Integration Synergy"].map((h) => (
              <div key={h} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.2 }}>
                {h.toUpperCase()}
              </div>
            ))}
            {SFO_PTC_DOMAINS.map((d) => (
              [d.domain, d.sfo, d.ptc, d.synergy].map((val, i) => (
                <div key={`${d.domain}-${i}`} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  {i === 0 ? <span style={{ fontWeight: 600 }}>{val}</span> : val}
                </div>
              ))
            ))}
          </div>
        </div>
      </BlackpaperSection>

      {/* PHASE III: INSTITUTIONAL LIQUIDATION */}
      <BlackpaperSection color="#FF6B35" label="PHASE III — INSTITUTIONAL LIQUIDATION MECHANICS">
        <BlackpaperHeading>The OTC Desk Imperative</BlackpaperHeading>
        <BlackpaperPara>
          Executing a market order of $232 million on a public centralized exchange will trigger <span style={{ color: "#FF6B35" }}>catastrophic market slippage</span>. Public order books rarely possess the localized liquidity depth to absorb a nine-figure sell order without collapsing the asset's price. Institutional OTC desks bypass the public order book entirely — sourcing liquidity through proprietary matching engines, dark pools, and direct capital relationships with institutional buyers.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The OTC desk provides a "locked quote" — a guaranteed, flat execution price for the entire block of assets, typically valid for 30 seconds to a few minutes. By accepting the quote, the seller offloads execution risk and price volatility entirely onto the provider. The market remains blind to the transaction until post-trade settlement, preventing predatory HFT algorithms from front-running the liquidation.
        </BlackpaperPara>

        <BlackpaperHeading sub>OTC Desk Comparison</BlackpaperHeading>
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "130px 80px 1fr 1fr", gap: 0, minWidth: 650 }}>
            {["Desk", "Min Trade", "Regulatory Status", "Key Strength"].map((h) => (
              <div key={h} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.2 }}>
                {h.toUpperCase()}
              </div>
            ))}
            {OTC_DESKS.map((d) => (
              [d.desk, d.minTrade, d.regulatory, d.strength].map((val, i) => (
                <div key={`${d.desk}-${i}`} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  {i === 0 ? <span style={{ fontWeight: 600 }}>{val}</span> : val}
                </div>
              ))
            ))}
          </div>
        </div>

        <div style={{
          padding: "14px 18px",
          background: "rgba(255,107,53,0.04)",
          border: "1px solid rgba(255,107,53,0.1)",
          borderRadius: 8,
          marginBottom: 28,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,107,53,0.6)", letterSpacing: 1.5, marginBottom: 6 }}>
            TEST TRANSACTION PROTOCOL
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Before executing the full transaction, run a <strong style={{ color: "#FF6B35" }}>$50K–$100K test</strong> through the entire OTC pipeline. Verify that digital assets move securely to the desk and that resulting fiat clears the banking system without triggering automated AML freezes — which are extremely common when sudden massive wire transfers hit standard retail bank accounts.
          </p>
        </div>

        <BlackpaperHeading sub>Crypto-Native Institutional Custodians</BlackpaperHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, marginBottom: 20 }}>
          {CUSTODIANS.map((c) => (
            <div key={c.name} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "14px 16px",
            }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
                {c.name}
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, lineHeight: 1.55, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                {c.detail}
              </p>
            </div>
          ))}
        </div>
      </BlackpaperSection>

      {/* PHASE IV: CAPITAL PRESERVATION */}
      <BlackpaperSection color="#F4B728" label="PHASE IV — CAPITAL PRESERVATION & RISK MITIGATION">
        <BlackpaperHeading>Neutralizing Counterparty Banking Risk</BlackpaperHeading>
        <BlackpaperPara>
          Once $232 million is secured in fiat, the risk profile shifts from crypto volatility to <span style={{ color: "#F4B728" }}>traditional counterparty banking risk</span>. The FDIC limits insurance to $250,000 per depositor, per institution. Depositing $200M into a single bank means $199.75M becomes an unsecured claim in insolvency — potentially tied up in receivership for years. The collapses of Silicon Valley Bank, Credit Suisse, and First Republic are stark reminders that "too big to fail" does not guarantee uninsured deposit protection.
        </BlackpaperPara>

        <BlackpaperHeading sub>The IntraFi Sweep Solution</BlackpaperHeading>
        <BlackpaperPara indent>
          The IntraFi Network's Insured Cash Sweep (ICS) and CDARS programs solve this without manually opening hundreds of bank accounts. When $200M is deposited into an ICS-participating bank, proprietary software automatically fragments the capital into sub-$250K increments, sweeping them across thousands of participating FDIC-insured banks nationwide. The result: absolute multi-million-dollar FDIC protection on the entire principal, with a single banking relationship, single consolidated statement, and daily liquidity.
        </BlackpaperPara>

        <BlackpaperHeading sub>Preservation Instruments Comparison</BlackpaperHeading>
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "150px 80px 80px 80px 1fr 1fr", gap: 0, minWidth: 750 }}>
            {["Instrument", "Return", "Drawdown", "Liquidity", "Protection", "Notes"].map((h) => (
              <div key={h} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.2 }}>
                {h.toUpperCase()}
              </div>
            ))}
            {PRESERVATION_INSTRUMENTS.map((p) => (
              [p.instrument, p.annReturn, p.maxDrawdown, p.liquidity, p.protection, p.notes].map((val, i) => (
                <div key={`${p.instrument}-${i}`} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  {i === 0 ? <span style={{ fontWeight: 600 }}>{val}</span> : val}
                </div>
              ))
            ))}
          </div>
        </div>

        <div style={{
          padding: "14px 18px",
          background: "rgba(244,183,40,0.04)",
          border: "1px solid rgba(244,183,40,0.1)",
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(244,183,40,0.6)", letterSpacing: 1.5, marginBottom: 6 }}>
            BOND LADDER VS. MONEY MARKET — DECISION FRAMEWORK
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>Rate-cutting environment:</strong> MMF yields drop synchronously with benchmark rates. Construct a distributing Treasury bond ladder (1–3yr staggered maturities) to lock in the current yield curve, rendering returns immune to subsequent Fed rate cuts.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>Rate-holding/rising environment:</strong> MMFs automatically capture rising rates daily. Favor short-duration MMFs for maximum flexibility and immediate liquidity, with each rung of the ladder returning principal available for re-entry deployment.
          </p>
        </div>
      </BlackpaperSection>

      {/* PHASE V: TREASURY MANAGEMENT & RE-ENTRY */}
      <BlackpaperSection color="#00B4FF" label="PHASE V — TREASURY MANAGEMENT & NEXT-CYCLE PREPAREDNESS">
        <BlackpaperHeading>Generational Shifts in Asset Allocation</BlackpaperHeading>
        <BlackpaperPara>
          With capital protected and generating baseline yield, the SFO mandate shifts from preservation to tactical deployment. The Next-Gen UHNW cohort aggressively allocates toward private equity, direct business ownership, and venture capital — where capital compounds tax-deferred for a decade or more. Digital assets are no longer fringe speculation but a <span style={{ color: "#00B4FF" }}>core portfolio pillar</span>.
        </BlackpaperPara>

        <BlackpaperHeading sub>UHNW Allocation: Previous Gen vs. Next Gen</BlackpaperHeading>
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "150px 90px 90px 1fr", gap: 0, minWidth: 550 }}>
            {["Asset Class", "Previous Gen", "Next Gen", "Strategic Rationale"].map((h) => (
              <div key={h} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.2 }}>
                {h.toUpperCase()}
              </div>
            ))}
            {ALLOCATION_SHIFT.map((a) => (
              [a.asset, a.prevGen, a.nextGen, a.rationale].map((val, i) => (
                <div key={`${a.asset}-${i}`} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.5, background: i === 2 ? "rgba(0,180,255,0.04)" : "transparent" }}>
                  {i === 0 ? <span style={{ fontWeight: 600 }}>{val}</span> : val}
                </div>
              ))
            ))}
          </div>
        </div>

        <BlackpaperHeading sub>Securities-Backed Lines of Credit (SBLOC)</BlackpaperHeading>
        <BlackpaperPara indent>
          A core tenet of UHNW wealth management is the strict avoidance of unnecessary asset liquidation. Selling an appreciated asset triggers immediate capital gains tax, breaking the compounding curve. Instead, the SFO facilitates liquidity through SBLOCs — borrowing cash against the portfolio at 50–70% LTV ratios. Because debt is not taxable income, capital is accessed <span style={{ color: "#00B4FF" }}>entirely tax-free</span> while underlying assets continue to appreciate. The SBLOC interest rate (6–8%, often lower for institutional SFO clients) is eclipsed by retained market gains plus avoidance of the 23.8% federal capital gains rate.
        </BlackpaperPara>

        <BlackpaperHeading sub>Re-Entry Execution Checklist</BlackpaperHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {REENTRY_CHECKLIST.map((item, idx) => (
            <div key={idx} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "14px 18px",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "#00B4FF",
                background: "rgba(0,180,255,0.08)",
                borderRadius: 4,
                padding: "3px 8px",
                flexShrink: 0,
                marginTop: 2,
              }}>
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                  {item.label}
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </BlackpaperSection>
    </div>
  );
}

export default function LiquidityCascade() {
  const [activePhase, setActivePhase] = useState(0);
  const [activeNav, setActiveNav] = useState("overview");
  const { taoPrice, xrpPrice, zecPrice } = useMarketData();

  return (
    <>
    <GalaxyBackground />
    <ShootingStars />
    <AlienSaucer />
    <div style={{ minHeight: "100vh", background: "transparent", color: "#fff", fontFamily: "'DM Sans', sans-serif", position: "relative", zIndex: 2 }}>
      <div style={{ padding: "32px 28px 0", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, marginBottom: 8 }}>
          SUPERCYCLE CAPITAL ROTATION — 2028 HALVING
        </div>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 32,
            fontWeight: 700,
            margin: "0 0 6px",
            lineHeight: 1.15,
            background: "linear-gradient(135deg, #9D4EDD, #23F0C6, #F4B728)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Supercycle
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 24px", maxWidth: 620, lineHeight: 1.55 }}>
          A chronological matrix for capital rotation across Bittensor (TAO), Ripple (XRP), and Zcash — anchored to the Bitcoin halving as the definitive temporal fulcrum. Historical data: Oct 2023 → May 2026 realized 6,608x return.
        </p>

        <nav aria-label="Dashboard sections">
        <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4, overflowX: "auto", scrollbarWidth: "none" }}>
          {NAV_ITEMS.map((n) => (
            <button
              key={n.key}
              role="tab"
              aria-selected={activeNav === n.key}
              aria-controls={`panel-${n.key}`}
              id={`tab-${n.key}`}
              onClick={() => setActiveNav(n.key)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: 1.5,
                padding: "8px 14px",
                background: "none",
                border: "none",
                color: activeNav === n.key ? "#fff" : "rgba(255,255,255,0.3)",
                borderBottom: activeNav === n.key ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
        </nav>
      </div>

      <main role="tabpanel" id={`panel-${activeNav}`} aria-labelledby={`tab-${activeNav}`} style={{ padding: "20px 28px 60px", maxWidth: 960, margin: "0 auto" }}>
        {activeNav === "overview" && (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {PHASES.map((p, i) => (
                <PhaseCard
                  key={i}
                  phase={p}
                  isActive={activePhase === i}
                  onClick={() => setActivePhase(i)}
                  currentPrice={
                    p.asset === "TAO" ? taoPrice :
                    p.asset === "XRP" ? xrpPrice :
                    p.asset === "ZEC" ? zecPrice :
                    undefined
                  }
                />
              ))}
            </div>
            <Timeline activePhase={activePhase} setActivePhase={setActivePhase} />
            <CapitalFlowBar phases={PHASES} />
            <PhaseDetail phase={PHASES[activePhase]} />
          </>
        )}

        {activeNav === "macro" && (
          <>
            <MacroContext />
            <BtcDominanceNote />
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "20px 22px",
                marginTop: 20,
              }}
            >
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, marginBottom: 10 }}>
                THE MID-CYCLE DILEMMA
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.55)", margin: "0 0 10px" }}>
                The objective of macro capital rotation is not catching the absolute bottom of every asset simultaneously. The true edge lies in{" "}
                <span style={{ color: "#FF6B35" }}>chaining expansion phases</span>. While MSTR moved from $14 to $120 over 18 months, that same capital deployed in SOL generated
                a 19.6x return. One must rotate based on which asset is entering expansion next, ignoring nominal distance from cycle lows.
              </p>
            </div>
          </>
        )}

        {activeNav === "phases" && PHASES.map((p, i) => <PhaseDetail key={i} phase={p} />)}
        {activeNav === "signals" && <SignalsTab />}
        {activeNav === "cycles" && <CyclesTab />}
        {activeNav === "execution" && <ExecutionTab />}
        {activeNav === "calculator" && <CalculatorSection />}
        {activeNav === "predict" && <Predictions2028 />}
        {activeNav === "blackpaper" && <Blackpaper />}
        {activeNav === "conversion" && <ConversionTab />}

        <div
          style={{
            marginTop: 30,
            padding: "14px 16px",
            background: "rgba(255,60,60,0.06)",
            border: "1px solid rgba(255,60,60,0.12)",
            borderRadius: 8,
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,60,60,0.6)", letterSpacing: 1.5, marginBottom: 4 }}>
            RISK DISCLOSURE
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.55, margin: 0 }}>
            This is a theoretical analysis based on historical data. Cryptocurrency investments carry extreme risk including total loss of capital.
            Past performance does not guarantee future results. Executing large orders in illiquid assets carries significant slippage risk.
            Privacy coins face ongoing regulatory scrutiny and potential delistings. This is not financial advice.
          </p>
        </div>
      </main>
    </div>
    </>
  );
}
