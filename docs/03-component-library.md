# 03 · Component Library

Every primitive here obeys the [Design System](./02-design-system.md): 1px borders,
`rounded-md`, no shadows, 8px grid, color only where it means something.

Components live in `frontend/src/components/ui/`.

---

## Buttons

| Variant | Style |
|---------|-------|
| **Primary** | `bg-indigo-600 text-white rounded-md` (project theme, not black), no shadow. Hover: `indigo-700`. |
| **Secondary** | `bg-surface border rounded-md text-text`. Hover: `--row-hover`. |
| **Danger** | `bg-surface border border-danger text-danger rounded-md`. Hover: faint red tint. |
| **Ghost** | Transparent, text only, hover background. For toolbar/icon actions. |
| **Outline** | Transparent + border, like secondary without the surface fill. |

- Heights: `sm` 32px · `md` 36px · `lg` 40px. Default 36px.
- **Props (all features):** `variant`, `size`, `leftIcon` (prefix), `rightIcon`
  (suffix), `loading` (spinner + auto-disabled), `iconOnly` (square icon button),
  `fullWidth`, plus every native `<button>` attribute. `cursor-pointer` built in.
- Disabled: 50% opacity, no pointer.

## Inputs

- Height **40px**, `rounded-md`, 1px gray border, 12px horizontal padding.
- **Focus:** 1px `--info` border. **No glow.**
- Placeholder uses `--text-secondary`.
- States: default · focus · error (1px `--danger` border + small danger helper text) · disabled.
- Variants: text, textarea, select (Radix Select styled), combobox, number, search
  (with leading Lucide search icon), date picker.

## Badges

The **only** consistently colored elements. Everything else stays white/neutral.

| Meaning | Color | Example label |
|---------|-------|---------------|
| Success | green | Active, Paid, Delivered |
| Warning | orange | Pending, Low stock |
| Danger | red | Cancelled, Out of stock |
| Info | blue | New, Processing |
| Neutral | gray | Draft, Archived |

- Style: `rounded-md`, 1px border in the accent color, faint tinted background,
  micro (12px/500) text. Compact — they sit inside table cells.

## Tables (enterprise style)

The workhorse. See GitHub/Stripe for the target feel.

- Container: 1px border, `rounded-md`, `overflow-hidden`.
- **Header:** background `#FAFAFA` (light), `--text-secondary` uppercase-ish labels, 1px bottom border.
- **Rows:** 1px bottom border between rows; hover background `#F9FAFB`.
- **Checkbox column:** rounded checkbox, enables bulk actions bar.
- **Density:** row height ~44px, 12–16px cell padding, tabular numerals for numbers.
- **Clicking a row → opens the [Right Context Panel](./06-signature-features.md).**
- **Pagination:** bottom bar inside the container border. Page size selector + range.
- Sortable headers (caret icon), column visibility menu, sticky header on scroll.
- **Loading:** skeleton rows, never a spinner.

## Product list (rich table)

Not a boring table — columns:

`Image · Product · Stock · Price · Category · Status · Sales · Actions`

- Image: 32×32 rounded-md thumbnail.
- Product: name + SKU (secondary line).
- Stock: number + tiny bar or low-stock badge.
- Sales: micro sparkline (2px line).
- Status: badge. Actions: ghost icon buttons (edit, duplicate, delete) or `⋯` menu.

## Cards / KPI cards

- **Border only, no shadow, no gradient.** `rounded-md`, 1px border, `--surface` bg.
- KPI card contents: label (secondary) → big value (heading, tabular) → delta badge
  (`+18%` in success/danger) → small inline sparkline.

```
┌─────────────────────────────┐
│ Revenue                     │
│ ₹2.4M            +18% ▲      │
│ ▁▂▃▅▆▇  (2px sparkline)      │
└─────────────────────────────┘
```

## Dialog / Modal

- 1px border, `rounded-md`, **no shadow**. Dim the backdrop instead (`rgba(0,0,0,.4)`).
- Header (title + close) / body / footer (right-aligned actions) sections separated
  by 1px borders. Radix Dialog for a11y + focus trap.

## Notifications / Toasts

- Slide in **top-right**, small, 1px border, `rounded-md`, no shadow.
- Variants map to status colors via a left 2px accent bar or a colored icon.
- Auto-dismiss + manual close. Stack vertically.

## Empty states

- Centered: simple line illustration/icon → title ("No products") → one-line
  helper ("Start by creating one.") → primary button ("Create Product").
- Calm and minimal — no big graphics.

## Loading — skeletons only

- Skeleton blocks matching the real layout (table rows, KPI cards, panel sections).
- Subtle shimmer or static neutral fill. **Never a spinner.**

## Tabs

- Underline-style tabs (Radix Tabs). Active tab: `--text` + 2px bottom accent
  (the one allowed 2px, for the active indicator). Inactive: `--text-secondary`.
- Used in Product Details and Order Details.

## Command Palette (⌘K / Ctrl+K)

- Centered overlay input, results list, keyboard nav. Built with `cmdk`.
- 1px border, `rounded-md`, no shadow, dimmed backdrop.
- Actions: Go to Products, Create Product, Orders, Customers, Settings, plus
  fuzzy search over entities. See [06-signature-features.md](./06-signature-features.md).

## Charts

- Line thickness **2px**. **No gradient fills.** Minimal gridlines, muted axis text.
- Tooltip: 1px border, `rounded-md`, no shadow.
- Palette: neutral by default; use status colors only when a series has meaning.

## Avatars

- Circle, initials fallback on neutral background, small (24/32px) in tables.

## Layout components

- `Sidebar`, `TopNav`, `WorkspaceDock`, `RightContextPanel`, `PageContainer`
  (bordered section wrapper), `Toolbar` (filter/search/action row above tables).
