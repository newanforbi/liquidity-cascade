# Liquidity Cascade Design System

## Overview

A dark cyberpunk aesthetic with neon accent colors, premium typography, and sophisticated component patterns. This design system is built for high-contrast, data-rich interfaces with a focus on visual hierarchy and interactive depth.

**Visual Characteristics:**
- Deep space background (`#0A0B0F`)
- Neon accent colors with glowing effects
- Transparent surfaces with subtle borders
- Premium monospace and sans-serif typography
- Smooth transitions and interactive feedback
- Canvas-based animated backgrounds (galaxy, stars, effects)

---

## Color Palette

### Background Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-base` | `#0A0B0F` | Main page background, darkest tone |
| `--color-bg-surface` | `rgba(255,255,255,0.02)` | Card and panel backgrounds |
| `--color-bg-surface-hover` | `rgba(255,255,255,0.03)` | Hover state for surfaces |
| `--color-bg-border` | `rgba(255,255,255,0.06)` | Primary borders |
| `--color-bg-border-subtle` | `rgba(255,255,255,0.03)` | Secondary/faint borders |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#ffffff` | Main text, headings |
| `--color-text-secondary` | `rgba(255,255,255,0.7)` | Body text, descriptions |
| `--color-text-tertiary` | `rgba(255,255,255,0.5)` | Secondary info, labels |
| `--color-text-muted` | `rgba(255,255,255,0.35)` | Subtle text, captions |
| `--color-text-faint` | `rgba(255,255,255,0.2)` | Very faint, deemphasized |

### Accent Colors (Phase Indicators)

| Token | Hex | Asset | Usage |
|-------|-----|-------|-------|
| `--color-accent-sol` | `#00FFA3` | Solana | Phase 1, bright green-cyan |
| `--color-accent-mstr` | `#FF6B35` | MicroStrategy | Phase 2, vibrant orange |
| `--color-accent-zec` | `#F4B728` | Zcash | Phase 3-4, golden yellow |
| `--color-accent-alt` | `#6450FF` | Alternate | Supplementary accents |

### Dimmed Accent Colors (Background Tints)

For card backgrounds and subtle emphasis:

```css
--color-accent-sol-dim: rgba(0,255,163,0.12);      /* 12% opacity */
--color-accent-mstr-dim: rgba(255,107,53,0.12);    /* 12% opacity */
--color-accent-zec-dim: rgba(244,183,40,0.12);     /* 12% opacity */
```

### Example Usage

```html
<!-- Primary accent (SOL green) -->
<div style="color: var(--color-accent-sol); border: 1px solid var(--color-accent-sol-dim);">
  Solana Phase
</div>

<!-- Muted text on surface -->
<div style="background: var(--color-bg-surface); color: var(--color-text-muted);">
  Secondary information
</div>
```

---

## Typography System

### Fonts

| Name | Family | Use Case |
|------|--------|----------|
| **Mono** | `'JetBrains Mono'` | Code, numbers, technical labels, precision data |
| **Sans** | `'DM Sans'` | Body text, descriptions, readable content |
| **Display** | `'Space Grotesk'` | Large headings, prominent asset names |
| **Serif** | `'Source Serif 4'` | Long-form content, quotes (optional) |

**Font Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
```

### Font Sizes (px)

| Token | Size | Usage |
|-------|------|-------|
| `--font-size-xs` | 8px | Tiny labels, superscript |
| `--font-size-sm` | 9px | Caption text, metadata |
| `--font-size-base` | 11px | Small labels, monospace info |
| `--font-size-md` | 12px | Form labels, small body |
| `--font-size-lg` | 13px | Body text, descriptions |
| `--font-size-xl` | 14px | Primary body text |
| `--font-size-2xl` | 18px | Card values, emphasis |
| `--font-size-3xl` | 20px | Large numbers, subheadings |
| `--font-size-4xl` | 22px | Section headers |
| `--font-size-5xl` | 28px | Primary headings, asset names |

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `--font-weight-regular` | 400 | Body text, default weight |
| `--font-weight-medium` | 500 | Slightly emphasized |
| `--font-weight-semibold` | 600 | Labels, buttons, emphasis |
| `--font-weight-bold` | 700 | Headings, strong emphasis |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--letter-spacing-normal` | 0 | Regular text |
| `--letter-spacing-wide` | 1px | Body text |
| `--letter-spacing-wider` | 1.2px | Light emphasis |
| `--letter-spacing-widest` | 1.5px | Uppercase labels, monospace |
| `--letter-spacing-mono` | 2px | Small uppercase labels |

### Line Height

| Token | Value | Usage |
|-------|-------|-------|
| `--line-height-tight` | 1.1 | Headings, single-line text |
| `--line-height-normal` | 1.5 | Default line spacing |
| `--line-height-relaxed` | 1.55 | Compact body text |
| `--line-height-loose` | 1.65 | Readable body text, descriptions |

### Typography Examples

```html
<!-- Monospace label with wide letter spacing -->
<span style="font-family: var(--font-mono); font-size: var(--font-size-sm); letter-spacing: var(--letter-spacing-monospace);">
  PHASE 1
</span>

<!-- Display heading -->
<h1 style="font-family: var(--font-display); font-size: var(--font-size-5xl); font-weight: var(--font-weight-bold);">
  SOL
</h1>

<!-- Body text with secondary color -->
<p style="font-family: var(--font-sans); font-size: var(--font-size-lg); color: var(--color-text-secondary); line-height: var(--line-height-loose);">
  Description text goes here...
</p>
```

---

## Spacing System

Consistent 4px-based spacing scale:

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Micro spacing |
| `--spacing-sm` | 6px | Small gaps |
| `--spacing-md` | 8px | Normal spacing |
| `--spacing-lg` | 10px | Medium gaps |
| `--spacing-xl` | 12px | Large spacing |
| `--spacing-2xl` | 14px | Larger spacing |
| `--spacing-3xl` | 18px | Component padding |
| `--spacing-4xl` | 20px | Major spacing |
| `--spacing-5xl` | 22px | Large padding |
| `--spacing-6xl` | 24px | Card padding (horizontal) |
| `--spacing-7xl` | 30px | Section margins |

### Example

```html
<div style="padding: var(--spacing-6xl) var(--spacing-5xl); gap: var(--spacing-lg);">
  <!-- Content with consistent spacing -->
</div>
```

---

## Border Radius

Subtle, refined curves:

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 3px | Badges, small elements |
| `--radius-md` | 4px | Input borders, minimal |
| `--radius-lg` | 6px | Buttons, small cards |
| `--radius-xl` | 8px | Medium components |
| `--radius-2xl` | 10px | Large cards, major panels |

---

## Component Patterns

### Card (Primary Container)

```html
<div style="
  background: var(--color-bg-surface);
  border: 1px solid var(--color-bg-border);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-6xl) var(--spacing-5xl);
  transition: all var(--transition-normal);
">
  Content here
</div>
```

**Hover Effect:**
```css
:hover {
  background: var(--color-bg-surface-hover);
  border-color: var(--color-bg-border);
}
```

### Phase Badge (With Accent Color)

```html
<div style="
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-md);
">
  <!-- Glow dot -->
  <div style="
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-accent-sol);
    box-shadow: 0 0 8px var(--color-accent-sol), 0 0 16px rgba(0,255,163,0.4);
  "></div>
  
  <!-- Label -->
  <span style="
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--color-accent-sol);
    letter-spacing: var(--letter-spacing-monospace);
    text-transform: uppercase;
  ">
    Phase 1
  </span>
</div>
```

### Data Display Cell

```html
<div style="
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl) var(--spacing-2xl);
  border: 1px solid rgba(255,255,255,0.05);
">
  <div style="
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    letter-spacing: var(--letter-spacing-widest);
    margin-bottom: var(--spacing-md);
  ">
    LABEL
  </div>
  <div style="
    font-family: var(--font-mono);
    font-size: var(--font-size-2xl);
    color: var(--color-accent-sol);
    font-weight: var(--font-weight-semibold);
  ">
    $191.90
  </div>
</div>
```

### Button

```html
<button style="
  padding: var(--spacing-xl) var(--spacing-2xl);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  border: none;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-bg-border);
  cursor: pointer;
  transition: all var(--transition-normal);
">
  Button Text
</button>

button:hover {
  background: var(--color-bg-surface-hover);
  border-color: var(--color-glow-green);
}
```

---

## Canvas Animations & Effects

### Galaxy Background

A procedurally generated space background with:
- Deep dark base: `#0A0B0F`
- Nebula clouds with soft radial gradients (4 layers)
- Star field with varying sizes and brightness
- Occasional glow halos on bright stars

**Implementation Notes:**
- Use Canvas 2D context for performance
- Generate stars with seeded RNG for consistency
- Render nebulae with `createRadialGradient`
- Responsive to window size and pixel ratio

### Shooting Stars

Animated stars that traverse the viewport:
- Spawn from random edges
- Travel at varying speeds (6-14 px/frame)
- Tail length: 80-200px
- Lifetime: 60-120 frames
- Color: HSL-based with hue variation
- Max concurrent: 3

**Gradient Composition:**
- Head: Bright, full opacity
- Mid: Reduced opacity (0.4x)
- Tail: Transparent falloff

### Alien Saucer

Occasional UFO-like flying object with phases:
1. **Entering** (90 frames): Fade in and approach
2. **Hovering** (480 frames): Bobbing motion, pulsing lights, tractor beam
3. **Departing**: Fade out and accelerate away

**Visual Elements:**
- Glow aura: Green with 70px radius
- Body disc: Gradient shading
- Dome: Semi-transparent blue hemisphere
- Rim lights: 7 blinking accent lights
- Tractor beam: Green trapezoid gradient (hover phase)

---

## Interactive Patterns

### Hover States

Cards and interactive elements expand or brighten on hover:

```css
transition: all var(--transition-normal);

:hover {
  background: var(--color-bg-surface-hover);
  border-color: var(--color-bg-border);
}
```

### Focus States (Accessibility)

Always provide keyboard focus indicators:

```css
:focus {
  outline: 2px solid var(--color-accent-sol);
  outline-offset: 2px;
}
```

### Active/Selected States

For phase cards and tabs:

```css
.active {
  background: var(--color-accent-sol-dim);
  border: 1.5px solid rgba(0,255,163,0.5);
}

/* Top gradient line indicator */
::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-accent-sol), transparent);
}
```

---

## Transitions

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `--transition-fast` | 0.2s | ease | Quick interactions, hovers |
| `--transition-normal` | 0.3s | ease | Standard UI transitions |
| `--transition-slow` | 0.5s | ease | Major layout changes, fades |

---

## Layout Patterns

### Grid Layout (Responsive)

```html
<div style="
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-lg);
">
  <!-- Auto-responsive cards -->
</div>
```

### Flex with Gap

```html
<div style="
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
">
  <!-- Flexible layout -->
</div>
```

### Layered Backgrounds

Use z-index for depth:
- Canvas backgrounds: z-index 0-1
- Content: z-index 2+

```css
canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 2;
}
```

---

## Implementation Checklist

When applying this design system to a new project:

- [ ] Import Google Fonts (DM Sans, JetBrains Mono, Space Grotesk)
- [ ] Set base background to `#0A0B0F`
- [ ] Link `design-system.css` or paste CSS variables into your stylesheet
- [ ] Use `design-tokens.json` as reference for exact values
- [ ] Implement card backgrounds as `rgba(255,255,255,0.02)`
- [ ] Use accent colors for phase/section indicators
- [ ] Ensure all interactive elements have hover states
- [ ] Test accessibility with keyboard navigation
- [ ] Verify spacing consistency with `--spacing-*` tokens
- [ ] Consider Canvas backgrounds for visual depth (optional but recommended)

---

## File References

- **`design-tokens.json`** - Complete token values in JSON format
- **`design-system.css`** - CSS variables and utility classes
- **`LiquidityCascade.jsx`** - Reference implementation in React

---

## Tips for Adaptation

1. **Colors:** All accent colors are designed to be easily swappable. Replace SOL, MSTR, ZEC with your own phase colors.
2. **Typography:** The system works with any sans/mono combination. DM Sans + JetBrains Mono is recommended.
3. **Spacing:** The 4px scale is forgiving — doubling or halving spacing works naturally.
4. **Components:** Build on the card and badge patterns; they're flexible enough for most use cases.
5. **Dark Mode:** This system IS dark mode. For light mode, invert backgrounds and swap text colors.

---

## Contact & Questions

For implementation questions or design adjustments, refer to the source project structure or design tokens JSON.
