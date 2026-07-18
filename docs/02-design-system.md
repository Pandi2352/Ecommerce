# 02 · Design System

This is the source of truth for the visual language. Every component in
[03-component-library.md](./03-component-library.md) derives from these tokens.

## Design principles

| Rule | |
|------|---|
| ❌ **No shadows** | Never use `box-shadow`. Separation is always a 1px border. |
| ✅ **`rounded-md` everywhere** | 6px corner radius is the default. |
| ✅ **1px borders for separation** | Borders define regions, not shadows or fills. |
| ✅ **8px spacing grid** | All padding/margins/gaps are multiples of 4/8px. |
| ✅ **Neutral background** | The canvas is quiet; content stands out by contrast. |
| ✅ **Color only where needed** | Accents on badges, focus rings, status, key CTAs — not decoration. |
| ✅ **Information density** | Like Linear / Vercel / GitHub / Stripe — tight but legible. |

> The single most important rule: **if you're about to add a shadow, add a border
> instead.** If you're about to add color, ask whether it carries meaning.

> **Brand-mark exceptions.** The no-shadow / no-gradient rules apply to **UI surfaces**
> (cards, tables, panels, buttons). The **brand logo** and **favicon** may use a
> gradient + subtle glow, and the **sidebar menu icons** are intentionally duotone and
> colorful — these are identity/decoration, deliberately exempt. Everything else stays
> flat and border-based.

## Color tokens

### Light mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `lab(98.26% 0 0)` | App background / outlet canvas (clean neutral near-white) |
| `--surface` | `#FFFFFF` | Cards, panels, tables, inputs |
| `--border` | `#E5E7EB` | All 1px separators |
| `--text` | `#111827` | Primary text |
| `--text-secondary` | `#6B7280` | Secondary / muted text |
| `--success` | `#16A34A` | Success badges, positive deltas |
| `--warning` | `#F59E0B` | Warning / pending |
| `--danger` | `#DC2626` | Danger / cancelled / destructive |
| `--info` | `#2563EB` | Info, focus border, links |

### Dark mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#0F1117` | App background |
| `--surface` | `#181A20` | Cards, panels |
| `--border` | `#2A2E36` | 1px separators |
| `--text` | `#F9FAFB` | Primary text |
| `--text-secondary` | `#9CA3AF` | Secondary text |

> Status colors (success/warning/danger/info) stay the same hue in dark mode; they
> already read well on the dark surface. Adjust only if contrast testing fails.

### Sidebar (theme-aware — light in light mode, graphite in dark)

The sidebar follows the theme (it is **not** always dark). Tokens flip via `.dark`.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--sidebar-bg` | `#FFFFFF` | `#111217` | Sidebar surface |
| `--sidebar-border` | `#EBEDF0` | `#23252D` | Separators / right border |
| `--sidebar-hover` | `#F3F4F6` | `#1B1D24` | Row hover **and** active-row background |
| `--sidebar-text` | `#566072` | `#97A1B2` | Inactive item text |
| `--sidebar-heading` | `#9AA2B1` | `#5B6472` | Section labels |
| `--sidebar-accent` | `#6366F1` | `#818CF8` | Submenu dots / pills |

**Active state:** subtle `--sidebar-hover` background + stronger text (no white pill,
no vertical accent line). **Menu icons are duotone**: a colored outline + faint fill
of the same per-item hue (each item has its own color) — the one place color is used
decoratively, by design. Collapsed sidebar shows hover **flyouts** (label tooltip for
leaves, submenu popover for parents).

### Table-specific

| Token | Hex | Usage |
|-------|-----|-------|
| `--table-header-bg` | `#FAFAFA` | Table header row (light mode) |
| `--table-row-hover` | `#F9FAFB` | Row hover (light mode) |

## Typography

| Level | Size / Weight | Usage |
|-------|---------------|-------|
| Display | 24px / 600 | Page titles |
| Heading | 18px / 600 | Section titles, KPI values |
| Body | 14px / 400 | Default text, table cells |
| Small | 13px / 400 | Secondary text, metadata |
| Micro | 12px / 500 | Badges, labels, timestamps |

- **Font:** `Inter` (or system UI stack fallback). Tabular numerals for tables and KPIs.
- Line height 1.4–1.5 for body. Titles tighter (1.2).
- Never below 12px for readable text.

## Spacing scale (8px grid)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

- Component internal padding: 12–16px
- Gaps between cards: 16px
- Page gutters: 24px
- Section vertical rhythm: 24–32px

## Radius & borders

- Radius: **`rounded-md` = 6px** everywhere. (Pills/avatars = full round.)
- Border: always **1px**, color `--border`. Never 2px except focus states.
- **No `box-shadow` anywhere.**

## Focus & interaction

- **Focus:** 1px `--info` (`#2563EB`) border. **No glow, no ring blur.**
- **Hover:** subtle background shift only (`--table-row-hover`, `--sidebar-hover`).
- **Transitions:** 120–150ms ease for hover/panel/dock; keep it snappy.

## Motion

- Right Context Panel: slide-in from right, 150ms.
- Toasts: slide from top-right, small.
- Dock tab switch: instant (no animation — feels faster).
- Loading: **skeletons, never spinners.**

## Tailwind config sketch

```js
// tailwind.config.js
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: { DEFAULT: 'var(--text)', secondary: 'var(--text-secondary)' },
        success: '#16A34A', warning: '#F59E0B',
        danger: '#DC2626', info: '#2563EB',
      },
      borderRadius: { md: '6px' },
      boxShadow: { none: 'none' }, // shadows are disabled by convention
    },
  },
}
```

Tokens live as CSS variables on `:root` and `.dark`, so dark mode is a class flip
on `<html>` — no component changes.

```css
:root {
  --bg:#F7F8FA; --surface:#FFFFFF; --border:#E5E7EB;
  --text:#111827; --text-secondary:#6B7280;
}
.dark {
  --bg:#0F1117; --surface:#181A20; --border:#2A2E36;
  --text:#F9FAFB; --text-secondary:#9CA3AF;
}
```
