import { useState, useEffect, useRef, useCallback } from "react";

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
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
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

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (timestamp) => {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (timestamp - lastSpawnRef.current >= nextSpawnDelayRef.current) {
        if (starsRef.current.length < MAX_STARS) {
          starsRef.current.push(spawnStar(canvas.width, canvas.height));
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

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (timestamp) => {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn
      if (!saucerRef.current && timestamp - lastSpawnRef.current >= nextSpawnDelayRef.current) {
        saucerRef.current = spawnSaucer(canvas.width, canvas.height);
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
          const W = canvas.width, H = canvas.height;
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
    asset: "SOL",
    name: "Solana",
    role: "Speculative Vanguard",
    color: "#00FFA3",
    colorDim: "rgba(0,255,163,0.12)",
    entryDate: "Dec 2022",
    exitDate: "Mar 2024",
    entryPrice: "$9.76",
    exitPrice: "$191.90",
    multiple: "19.66x",
    capitalIn: 100000,
    capitalOut: 1966000,
    halvingDistance: "-1 Month (Front-run)",
    monthsFromHalving: -1,
    entryMonths: "-16",
    description:
      "Solana structurally front-runs the halving. Retail-driven speculation, memecoin liquidity, and DeFi velocity propel SOL into a parabolic expansion before Bitcoin's supply shock even occurs.",
    mechanics: [
      "Hybrid PoH consensus enables sub-second finality and negligible fees",
      "Retail capital deploys early, anticipating post-halving altcoin season",
      "Memecoin and DeFi volume create self-reinforcing network effects",
      "97% drawdown from 2021 highs created extreme compression entry",
    ],
    exitSignal:
      "Pre-halving narrative reaches maximum saturation. Network congestion spikes and retail euphoria dominates social sentiment — risk/reward deteriorates rapidly.",
    keyInsight:
      "SOL achieved a near 20x multiple exactly one month before the April 2024 Bitcoin halving, decisively invalidating the assumption that all altcoins lag Bitcoin.",
  },
  {
    id: 2,
    asset: "MSTR",
    name: "MicroStrategy",
    role: "Leveraged Institutional Proxy",
    color: "#FF6B35",
    colorDim: "rgba(255,107,53,0.12)",
    entryDate: "Mid 2024",
    exitDate: "Nov 2024",
    entryPrice: "$120.00",
    exitPrice: "$421.88",
    multiple: "3.51x",
    capitalIn: 1966000,
    capitalOut: 6900660,
    halvingDistance: "+7 Months",
    monthsFromHalving: 7,
    entryMonths: "+2 to +4",
    description:
      "MicroStrategy operates as a leveraged financial instrument amplifying Bitcoin's post-halving price discovery. Institutional capital floods in as BTC breaks prior all-time highs.",
    mechanics: [
      "Convertible notes and equity issuance fund continuous BTC acquisition",
      "Embedded beta of ~1.77x relative to Bitcoin price movements",
      "mNAV premium creates accretive feedback loop per share",
      "TradFi institutions use MSTR as regulated high-beta BTC exposure",
    ],
    exitSignal:
      "mNAV premium reaches historical extremes (2.0–3.0x). Bitcoin's parabolic advance stalls — magnified downside via 1.77 beta becomes existential portfolio risk.",
    keyInsight:
      "Rotating into MSTR at $120 is not 'buying the top' — it is purchasing the confirmed breakout of an asset entering its most violent acceleration phase.",
  },
  {
    id: 3,
    asset: "ZEC",
    name: "Zcash",
    role: "Terminal Liquidity Overflow",
    color: "#F4B728",
    colorDim: "rgba(244,183,40,0.12)",
    entryDate: "Early 2025",
    exitDate: "Nov 2025",
    entryPrice: "$20.00",
    exitPrice: "$674.00",
    multiple: "33.7x",
    capitalIn: 6900660,
    capitalOut: 232552242,
    halvingDistance: "+19 Months",
    monthsFromHalving: 19,
    entryMonths: "+9 to +12",
    description:
      "The terminal phase — irrational, narrative-driven, and devoid of long-term fundamental support. Legacy privacy assets capture the final overflow of exhausted market liquidity.",
    mechanics: [
      "zk-SNARKs enable fully shielded, mathematically provable privacy",
      "Nov 2024 halving cut block reward to 1.5625 ZEC, curbing inflation",
      "Thin order books from exchange delistings amplify price movements",
      "DOJ seizure of 127,271 BTC validated on-chain privacy necessity",
    ],
    exitSignal:
      'ZEC blow-off top historically signals immediate onset of multi-year bear market — the "doomsday vehicle" pattern. No further rotations permitted.',
    keyInsight:
      "Explosive vertical rallies in legacy privacy coins are almost always the final act of a macro bull market. Jan 2018, May 2021, Nov 2025 — the pattern repeats.",
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
  { phase: 1, asset: "SOL", action: "Entry", timing: "Mid-to-Late 2026", note: "Bear market trough accumulation" },
  { phase: 1, asset: "SOL", action: "Exit → MSTR Entry", timing: "Mar 2028", note: "Front-run halving, rotate to institutional proxy" },
  { phase: 2, asset: "MSTR", action: "Exit → ZEC Entry", timing: "Nov 2028", note: "Month +7, institutional premium exhaustion" },
  { phase: 3, asset: "ZEC", action: "Exit to Fiat", timing: "Nov 2029", note: 'Month +19, terminal "doomsday" spike — exit crypto entirely' },
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

function PhaseCard({ phase, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
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
              onClick={() => setActivePhase(r.phase)}
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

  const phase1Out = initial * 19.66;
  const phase2In = phase1Out * (riskSplit / 100);
  const phase2Reserve = phase1Out - phase2In;
  const phase2Out = phase2In * 3.51;
  const phase3In = phase2Out * (riskSplit / 100);
  const phase3Reserve = phase2Out - phase3In + phase2Reserve;
  const phase3Out = phase3In * 33.7;
  const totalFinal = phase3Out + phase3Reserve;

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
          { label: "AFTER SOL (Phase 1)", value: phase1Out, color: "#00FFA3" },
          { label: "AFTER MSTR (Phase 2)", value: phase2Out + phase2Reserve, color: "#FF6B35" },
          { label: "RESERVED IN FIAT", value: phase3Reserve, color: "rgba(255,255,255,0.5)" },
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
        2028 CYCLE PROJECTION
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 18 }}>
        Projected rotation dates using the ~April 2028 halving as Month 0
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
            GLOBAL M2 (Oct 2025)
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, color: "#F4B728", fontWeight: 700 }}>$137T+</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            6.2% YTD expansion providing structural tailwind
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

const NAV_ITEMS = [
  { key: "overview", label: "OVERVIEW" },
  { key: "macro", label: "MACRO" },
  { key: "phases", label: "PHASES" },
  { key: "calculator", label: "CALCULATOR" },
  { key: "predict", label: "2028" },
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
  const g = "#00FFA3";
  const o = "#FF6B35";
  const y = "#F4B728";

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
          A Chronological Matrix for Capital Rotation Across Solana, MicroStrategy, and Zcash
        </p>
        <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.1)", margin: "24px auto 0" }} />
      </div>

      <BlackpaperSection label="I" color="rgba(255,255,255,0.4)">
        <BlackpaperHeading>The Architecture of a Rotation</BlackpaperHeading>
        <BlackpaperPara>
          There is a persistent myth that the cryptocurrency market moves as one — that when Bitcoin rises, everything rises with it,
          and when Bitcoin falls, everything falls together. It's a comforting story. It is also wrong.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The truth is more interesting and more useful. Liquidity does not flood the market like a tide lifting all boats.
          It <em style={{ color: "rgba(255,255,255,0.8)" }}>cascades</em> — moving through the ecosystem in a specific, repeatable sequence,
          governed by shifting psychology, structural supply dynamics, and macroeconomic triggers that can be mapped with startling precision
          against one fixed point in time: the Bitcoin halving.
        </BlackpaperPara>
        <BlackpaperPara indent>
          This paper maps that cascade across three distinct archetypes. First, a high-throughput retail layer that ignites
          <em style={{ color: g }}> before</em> the halving. Then, a leveraged institutional proxy that detonates in its
          <em style={{ color: o }}> immediate aftermath</em>. And finally, a dormant privacy ledger that absorbs the
          <em style={{ color: y }}> terminal overflow</em> of exhausted market liquidity — right before the lights go out.
        </BlackpaperPara>
        <BlackpaperQuote color={g}>
          The rotation does not follow Bitcoin. Certain assets structurally front-run the halving, others serve as delayed proxies,
          and a final cohort acts as the liquidity sink at the end of the world.
        </BlackpaperQuote>
        <BlackpaperPara indent>
          Conventional wisdom prescribes a linear procession: Bitcoin leads, large-cap altcoins follow, micro-caps clean up.
          Empirical data from the 2022–2026 market sequence reveals something far more choreographed. The flow has a shape. It has a tempo.
          And if you know where to stand, you can ride each wave as it breaks — stepping off one crest and onto the next before
          the first has finished curling.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="II" color="rgba(255,255,255,0.4)">
        <BlackpaperHeading>The Fuel and the Spark</BlackpaperHeading>
        <BlackpaperHeading sub>Global M2: The Invisible Engine</BlackpaperHeading>
        <BlackpaperPara>
          No cryptocurrency bull market has ever materialized in a vacuum. Every parabolic expansion in the history of digital assets
          has been preceded by the same invisible precondition: the expansion of the global money supply. When central banks print,
          crypto absorbs. The correlation between global M2 and cryptocurrency price appreciation exceeds{" "}
          <BlackpaperDatum value="84%" color={g} /> — a figure so high it borders on deterministic.
        </BlackpaperPara>
        <BlackpaperPara indent>
          But the relationship is not instantaneous. There is an incubation period — a gap of roughly{" "}
          <BlackpaperDatum value="56 to 60 days" color={o} /> between when the liquidity enters the system and when
          it manifests as upward price action. During the 2020 pandemic response, a staggering 21% expansion in global M2
          detonated one of the most explosive bull runs in the asset class's short history. By October 2025, the pattern had
          repeated: global M2 breached{" "}
          <BlackpaperDatum value="$137 trillion" color={y} />, expanding 6.2% year-to-date, driven by coordinated
          rate cuts and the quiet, relentless engine of sovereign debt monetization.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Recognizing the trajectory of M2 is not optional. It is the prerequisite. Without expanding liquidity, the rotational gears seize.
          Every entry, every exit, every phase described in this paper is downstream of a single question:
          are central banks expanding or contracting?
        </BlackpaperPara>

        <BlackpaperHeading sub>The Halving: Month Zero</BlackpaperHeading>
        <BlackpaperPara>
          If M2 is the fuel, the Bitcoin halving is the spark. Every four years, the Bitcoin protocol executes a deterministic,
          unalterable reduction in its supply issuance — cutting the per-block mining reward by exactly 50%. When this programmatic supply shock
          collides with the persistent demand generated by an expanding money supply, the resulting imbalance forces price discovery upward
          with a violence that traditional markets rarely witness.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The cadence is metronomic. November 2012. July 2016. May 2020. April 2024. And the next:
          sometime in the spring of 2028. Each halving has served as the temporal anchor for the cycle that followed — the fulcrum
          around which every major expansion phase can be measured in months. For the purposes of this matrix, the{" "}
          <BlackpaperDatum label="HALVING" value="April 19, 2024" color="rgba(255,255,255,0.6)" /> is designated as{" "}
          <span style={{ color: "#fff", fontWeight: 600 }}>Month 0</span>. Every entry and exit in the rotation
          is calculated as a temporal distance from this single point.
        </BlackpaperPara>

        <BlackpaperHeading sub>Bitcoin Dominance: The Silent Signal</BlackpaperHeading>
        <BlackpaperPara>
          There is one more instrument a rotational trader must learn to read before touching a single position: Bitcoin Dominance.
          BTC.D — the ratio of Bitcoin's market capitalization to the total crypto market — traces the psychological arc of every cycle.
          When fear reigns, dominance rises: capital retreats to the benchmark. When euphoria takes over and Bitcoin establishes new highs,
          dominance hits a ceiling and fractures. Capital spills outward in search of higher-percentage returns.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The threshold is surgical. When BTC.D breaks below the{" "}
          <BlackpaperDatum value="57%–58.8%" color={o} /> zone after a sustained climb, the altcoin expansion has been
          formally triggered. In 2021, this breakdown arrived roughly 35 days after Bitcoin's initial momentum peak. Watching this single
          metric prevents the most expensive mistake in rotation trading: moving too early.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="PHASE 1" color={g}>
        <BlackpaperHeading>The Speculative Vanguard</BlackpaperHeading>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: g, fontWeight: 700, marginBottom: 20, letterSpacing: -0.5 }}>
          Solana (SOL)
        </div>
        <BlackpaperPara>
          Here is the first heresy of this framework: Solana does not wait for Bitcoin. It moves first.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Traditional cycle theory insists that all altcoins lag the benchmark — that they sit patiently until Bitcoin has completed
          its post-halving ascent and only then begin their secondary expansion. The data from 2022–2024 annihilates this assumption.
          Solana's primary parabolic move completed{" "}
          <em style={{ color: g }}>one month before the halving even occurred</em>.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Why? Because Solana's price engine runs on fundamentally different fuel than Bitcoin's. Its hybrid Proof-of-History consensus
          model enables sub-second finality and negligible transaction fees, making it the undisputed venue for retail-driven speculation —
          the memecoin launchpad, the DeFi playground, the NFT bazaar. Retail traders, operating with smaller capital bases and higher risk
          tolerance, don't wait for the halving. They{" "}
          <em style={{ color: "rgba(255,255,255,0.8)" }}>anticipate</em> the post-halving altcoin season and deploy capital months early,
          effectively front-running the macro narrative. By the time Bitcoin's supply shock arrives, Solana's move is already over.
        </BlackpaperPara>
        <BlackpaperQuote color={g}>
          From the ashes of a 97% drawdown — from $260 to $9 in the wreckage of the FTX collapse —
          Solana executed one of the most ferocious recoveries in crypto history.
        </BlackpaperQuote>
        <BlackpaperPara indent>
          The entry was December 21, 2022. The price:{" "}
          <BlackpaperDatum value="$9.76" color={g} />. Over the next fifteen months, SOL steadily reclaimed $30,
          then $100, then went vertical as memecoin liquidity exploded and active developer counts surged.
          The terminal momentum peak arrived on March 13, 2024 — one month before the halving — at{" "}
          <BlackpaperDatum value="$191.90" color={g} />. A{" "}
          <span style={{ color: g, fontWeight: 700 }}>19.66x</span> multiple.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Yes, SOL touched $294.85 in early 2025. But the{" "}
          <em style={{ color: "rgba(255,255,255,0.8)" }}>velocity</em> and <em style={{ color: "rgba(255,255,255,0.8)" }}>efficiency</em>{" "}
          of the $9 → $191 move is what matters. Capital efficiency, not nominal highs, is the metric that compounds.
          An initial $100,000 deployed into SOL at the cycle bottom exits as{" "}
          <BlackpaperDatum value="$1,966,000" color={g} />. The retail vanguard phase is complete.
          The signal to exit: maximum narrative saturation, network congestion spikes, social euphoria reaching fever pitch.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="INTERLUDE" color="rgba(255,255,255,0.25)">
        <BlackpaperHeading sub>The Mid-Cycle Dilemma</BlackpaperHeading>
        <BlackpaperPara>
          It is mid-2024. The SOL position has been liquidated at $191.90, and the portfolio sits at nearly $2 million.
          The next target — MicroStrategy — is already at $120, up from its own December 2022 bottom of $14.50.
          The amateur investor sees this and feels the sting of a "missed" move.
        </BlackpaperPara>
        <BlackpaperPara indent>
          This is the moment the strategy either survives or dies. The objective of macro capital rotation is not
          to catch the absolute bottom of every single asset simultaneously. That would require a time machine.
          The true edge lies in <span style={{ color: o, fontWeight: 600 }}>chaining expansion phases</span>.
          MSTR's crawl from $14 to $120 took eighteen grueling months of sideways grinding. During those same eighteen months,
          that capital was in SOL, earning 19.6x. Rotating into MSTR at $120 is not buying the top — it is boarding
          a rocket that has just cleared the launch tower.
        </BlackpaperPara>
        <BlackpaperQuote color="rgba(255,255,255,0.35)">
          Rotate based on which asset is entering expansion next. Ignore the nominal distance from its cycle low.
          The only distance that matters is the one between here and where it's going.
        </BlackpaperQuote>
      </BlackpaperSection>

      <BlackpaperSection label="PHASE 2" color={o}>
        <BlackpaperHeading>The Leveraged Institutional Proxy</BlackpaperHeading>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: o, fontWeight: 700, marginBottom: 20, letterSpacing: -0.5 }}>
          MicroStrategy (MSTR)
        </div>
        <BlackpaperPara>
          MicroStrategy is not a software company. It has not been a software company in any meaningful sense since August 2020,
          when Michael Saylor repurposed its corporate treasury into the most audacious Bitcoin accumulation vehicle in the history
          of public markets. What MSTR actually is: a leveraged financial instrument with an embedded beta of approximately 1.77
          relative to Bitcoin, engineered to amplify every move in the benchmark — up and down.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The mechanics are elegant and recursive. When the market prices MSTR at a premium to its underlying Bitcoin holdings —
          the so-called mNAV premium — the company exploits the disparity. They issue new equity at the inflated valuation,
          use the proceeds to buy more Bitcoin, and in doing so increase the amount of BTC backing each individual share.
          The process is accretive. It feeds on itself. And it only works when Bitcoin is going up.
        </BlackpaperPara>
        <BlackpaperPara indent>
          This is why MSTR detonates in the post-halving window. When Bitcoin breaks its prior all-time highs — an event that
          typically materializes 6 to 8 months after the halving — institutional capital, hedge funds, and equity investors
          scramble for regulated, high-beta exposure. MSTR is the premier vehicle. The result is not a gentle repricing.
          It is vertical.
        </BlackpaperPara>
        <BlackpaperQuote color={o}>
          In the 2020–2021 cycle, MSTR peaked 9 months post-halving. In the 2024–2025 cycle, the blow-off top
          came at Month +7. The window is narrow and violent.
        </BlackpaperQuote>
        <BlackpaperPara indent>
          Following the April 2024 halving, MicroStrategy climbed 550% through the year. The spot Bitcoin ETF approvals
          added institutional legitimacy to the underlying thesis. The mNAV premium expanded as fast money piled in.
          On November 13, 2024, MSTR printed a vertical daily candle to{" "}
          <BlackpaperDatum value="$421.88" color={o} /> — exactly seven months post-halving.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The rolled $1.966 million enters at $120. It exits at $421.88. A{" "}
          <span style={{ color: o, fontWeight: 700 }}>3.51x</span> multiple. The portfolio now stands at{" "}
          <BlackpaperDatum value="$6,900,660" color={o} />. The exit signal: mNAV premium pushing past 2.0–3.0x,
          Bitcoin's advance stalling, and the 1.77 beta threatening magnified collapse. The institutional wave has crested.
          What comes next is the most dangerous phase of all.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="PHASE 3" color={y}>
        <BlackpaperHeading>The Terminal Liquidity Overflow</BlackpaperHeading>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: y, fontWeight: 700, marginBottom: 20, letterSpacing: -0.5 }}>
          Zcash (ZEC)
        </div>
        <BlackpaperPara>
          The final phase of every cryptocurrency cycle is a place of irrationality, narrative exhaustion, and desperate liquidity hunting.
          The primary layers are overvalued. The institutional proxies are spent. What remains is a mass of late-stage capital —
          retail and algorithmic alike — frantically searching for the last remaining pocket of outsized yield.
          This capital descends, with the predictability of gravity, into the forgotten corners of the market:
          legacy assets that have underperformed for years, written off as dead, derisively nicknamed "dino coins."
        </BlackpaperPara>
        <BlackpaperPara indent>
          Zcash is the archetype.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Launched in October 2016, Zcash pioneered the implementation of zk-SNARKs — zero-knowledge succinct non-interactive
          arguments of knowledge — a cryptographic breakthrough that enables fully shielded transactions. Sender, receiver,
          and amount: all mathematically verified, all completely hidden. It is, by any technical measure, the most sophisticated
          privacy technology in the cryptocurrency ecosystem.
        </BlackpaperPara>
        <BlackpaperPara indent>
          And yet ZEC has been in near-perpetual decline since its inception. The culprits: a "founders' reward" that dumped 20%
          of all block rewards onto the market for four straight years, the computational burden of shielded transactions
          that pushed most users to transparent addresses, and an endless cycle of regulatory delistings that drained liquidity
          from order books. By early 2025, ZEC was trading at roughly{" "}
          <BlackpaperDatum value="$20" color={y} /> — a rounding error compared to its 2016 launch.
        </BlackpaperPara>
        <BlackpaperQuote color={y}>
          A dormant asset. Thin order books. A compressed supply after the November 2024 halving.
          All it needed was a match.
        </BlackpaperQuote>
        <BlackpaperPara indent>
          The match arrived in October 2025, when the U.S. Department of Justice confiscated 127,271 BTC — roughly $15 billion —
          from the founder of the Cambodian Prince Group. The seizure accomplished in a single headline what years of advocacy
          could not: it demonstrated, with the blunt force of sovereign power, that Bitcoin's transparent ledger is a liability.
          Governments can trace it. Freeze it. Take it. The necessity of mathematically provable on-chain privacy was validated overnight.
        </BlackpaperPara>
        <BlackpaperPara indent>
          Arthur Hayes publicly predicted ZEC at $10,000. FOMO ignited. Capital rushed into shielded pools.
          And because the order books were paper-thin — hollowed out by years of delistings — the price action was
          not a rally. It was a detonation. From $20 to{" "}
          <BlackpaperDatum value="$674" color={y} /> in a matter of weeks. A{" "}
          <span style={{ color: y, fontWeight: 700 }}>33.7x</span> multiple. Nineteen months post-halving.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The portfolio: $6.9 million rotated into the most illiquid, legally scrutinized corner of the market at its point
          of maximum suppression, and extracted at the vertical peak of a narrative-driven blow-off.
          Final value:{" "}
          <BlackpaperDatum value="$232,552,242" color={y} />.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="VI" color="rgba(255,60,60,0.6)">
        <BlackpaperHeading>The Doomsday Vehicle</BlackpaperHeading>
        <BlackpaperPara>
          Here is the part nobody wants to hear. The ZEC blow-off top is not a beginning. It is an ending.
          Professional analysts have a name for explosive, vertical rallies in legacy privacy coins: the "doomsday vehicle."
          The pattern is unyielding:
        </BlackpaperPara>
        <div style={{ margin: "20px 0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { date: "January 2018", detail: "ZEC surged 14x to $700+", after: "Preceded the 2018 crypto winter. Bitcoin collapsed 85%." },
            { date: "May 2021", detail: "ZEC spiked 7x to $386", after: "Preceded a catastrophic market-wide liquidation cascade." },
            { date: "November 2025", detail: "ZEC exploded 33.7x to $674", after: "The verdict of the next winter is still being written." },
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
          The strategy ends at the ZEC exit. No further rotations into digital assets are permitted. The capital must be shielded
          in traditional, risk-free instruments while the ecosystem undergoes its inevitable 70%–90% cyclical drawdown.
          The practitioner who fails to exit here does not lose their gains from Phase 3. They lose everything —
          all three phases of compounded yield, vaporized in a bear market that has never failed to arrive.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="VII" color="rgba(255,255,255,0.4)">
        <BlackpaperHeading>The Rotational Matrix</BlackpaperHeading>
        <BlackpaperPara>
          Synthesized into its purest form, the strategy spans a 19-month execution window measured from the halving fulcrum.
          Every entry and exit is a temporal coordinate. Every rotation is a deliberate migration of capital from an exhausting
          expansion phase into the next ignition.
        </BlackpaperPara>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", margin: "24px 0" }}>
          {[
            { phase: "1", asset: "SOL", entry: "Month −16", exit: "Month −1", mult: "19.66x", capital: "$1.97M", color: g },
            { phase: "2", asset: "MSTR", entry: "Month +2", exit: "Month +7", mult: "3.51x", capital: "$6.90M", color: o },
            { phase: "3", asset: "ZEC", entry: "Month +9", exit: "Month +19", mult: "33.7x", capital: "$232.5M", color: y },
          ].map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "50px 60px 90px 90px 70px 90px", padding: "12px 16px", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}>
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
          Projected onto the 2028 halving — anticipated for April of that year — the matrix yields four dates:
          SOL accumulation in mid-to-late 2026, SOL exit and MSTR entry in March 2028, MSTR exit and ZEC accumulation in November 2028,
          and the terminal ZEC liquidation to fiat in November 2029. The assets occupying each archetype may shift.
          The temporal structure, if history holds, will not.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection label="VIII" color="rgba(255,255,255,0.4)">
        <BlackpaperHeading>The Psychology of Execution</BlackpaperHeading>
        <BlackpaperPara>
          The mathematics of this strategy are clean. The execution is anything but. The transition from Phase 2 to Phase 3
          is where portfolios go to die — not from market risk, but from psychological failure. It demands liquidating nearly
          $7 million of a celebrated, institutionally validated stock and deploying every dollar into a volatile, legally scrutinized
          privacy coin that appears, at the moment of purchase, to be clinically dead.
        </BlackpaperPara>
        <BlackpaperPara indent>
          For those who cannot stomach the full rotation, the paper prescribes a 70/30 split: seventy percent forward into the
          next phase, thirty percent into stable, yield-bearing fiat instruments. This compresses the terminal number significantly
          but guarantees generational capital creation even if the final phase is interrupted by regulatory embargoes or a mistimed exit.
        </BlackpaperPara>
        <BlackpaperPara indent>
          There is also the matter of liquidity itself. A $7 million market order into ZEC's thin books would cause catastrophic
          upward slippage on entry and equally devastating downward slippage on exit. Phase 3 positions must be built and unwound
          algorithmically — via TWAP or VWAP execution strategies spread across weeks, not minutes.
        </BlackpaperPara>
      </BlackpaperSection>

      <BlackpaperSection>
        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0 36px" }} />
        <BlackpaperPara>
          The cryptocurrency ecosystem is frequently dismissed as chaos. But underneath the noise — underneath the memes,
          the rug pulls, the regulatory theater — there is a clock. It ticks once every four years. And if you learn to read
          its face, you will see that the flow of money through this market has never been random. It has always been a cascade.
        </BlackpaperPara>
        <BlackpaperPara indent>
          It begins with the speculative vanguard — the fast, cheap, retail-powered network that ignites on anticipation alone.
          It passes through the institutional amplifier — the leveraged machine that captures Bitcoin's post-halving repricing
          with engineered precision. And it ends with the terminal overflow — the forgotten, illiquid relic that erupts one final time
          before the long winter descends.
        </BlackpaperPara>
        <BlackpaperPara indent>
          The halving is the fulcrum. M2 is the fuel. BTC.D is the signal. And the exit — the hardest part of all —
          is recognizing that when the doomsday vehicle goes vertical, it is not an invitation. It is a farewell.
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
                <div key={`${s.state}-${i}`} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.5, background: i === 1 ? "rgba(0,255,163,0.04)" : "transparent" }}>
                  {i === 0 ? <span style={{ fontWeight: 600 }}>{val}</span> : val}
                  {i === 1 && <span style={{ color: "#00FFA3" }}> {val}</span> ? null : null}
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

  return (
    <>
    <GalaxyBackground />
    <ShootingStars />
    <AlienSaucer />
    <div style={{ minHeight: "100vh", background: "transparent", color: "#fff", fontFamily: "'DM Sans', sans-serif", position: "relative", zIndex: 2 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />

      <div style={{ padding: "32px 28px 0", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, marginBottom: 8 }}>
          CAPITAL ROTATION MATRIX — 2024 HALVING CYCLE
        </div>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 32,
            fontWeight: 700,
            margin: "0 0 6px",
            lineHeight: 1.15,
            background: "linear-gradient(135deg, #00FFA3, #FF6B35, #F4B728)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          The Liquidity Cascade
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 24px", maxWidth: 620, lineHeight: 1.55 }}>
          A chronological matrix for capital rotation across Solana, MicroStrategy, and Zcash — anchored to the Bitcoin halving as the definitive temporal fulcrum.
        </p>

        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4, overflowX: "auto", scrollbarWidth: "none" }}>
          {NAV_ITEMS.map((n) => (
            <button
              key={n.key}
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
      </div>

      <div style={{ padding: "20px 28px 60px", maxWidth: 960, margin: "0 auto" }}>
        {activeNav === "overview" && (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {PHASES.map((p, i) => (
                <PhaseCard key={i} phase={p} isActive={activePhase === i} onClick={() => setActivePhase(i)} />
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
      </div>
    </div>
    </>
  );
}
