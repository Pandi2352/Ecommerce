# 10 · Implementation Plan — Reusable UI Framework & Ecommerce Dashboard

Create a senior-level React + TypeScript + Tailwind CSS UI framework and the
ecommerce admin dashboard. The layout system (Sidebar and Navbar) is fully reusable,
configurable, and easily portable to future projects; the dashboard feature is
specific to this ecommerce panel and matches the modules in
[05-modules.md](./05-modules.md) and the widgets in
[06-signature-features.md](./06-signature-features.md).

> **Workspace:** the frontend lives in `d:/02-vite-nestjs/ecommerce/frontend/`. All
> paths below are relative to it. (This is a first-cut plan for the admin shell +
> dashboard; the full enterprise module set is in [05-modules.md](./05-modules.md).)

## Architecture and Folder Structure

Clean architecture inside the `frontend/` workspace:

```
src/
├── app/
│   ├── App.tsx             # Root component with Providers
│   ├── routes.tsx          # Router configuration
│   └── providers.tsx       # Global Provider Wrapper (Theme, Sidebar)
│
├── assets/                 # Static assets (images, logos, illustrations)
│   └── illustration.tsx    # Responsive SVG components for sidebar decoration
│
├── components/
│   ├── ui/                 # Reusable generic UI components (copy-friendly)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Badge.tsx
│   │   └── index.ts
│   │
│   ├── layout/             # Portable App Shell Layout
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarItem.tsx
│   │   │   ├── SidebarGroup.tsx
│   │   │   ├── sidebar.config.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── Navbar/
│   │   │   ├── Navbar.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Notification.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── MainLayout.tsx  # Core Shell (integrates Sidebar + Navbar + Content)
│   │   └── AuthLayout.tsx  # Auth Shell (if needed)
│   │
│   └── common/             # Common application items
│       ├── Loader.tsx
│       └── ErrorBoundary.tsx
│
├── features/               # Isolated business/feature modules
│   └── dashboard/
│       ├── Dashboard.tsx   # Dashboard Page View
│       ├── components/
│       │   ├── StatsCard.tsx            # KPI card with custom sparklines
│       │   ├── SalesChart.tsx           # Dual-line chart (Revenue / Orders)
│       │   ├── CategoryDistribution.tsx # Donut chart for category sales share
│       │   ├── OrderStatusChart.tsx     # Radial progress rings for order statuses
│       │   ├── RecentActivity.tsx       # Order/customer events list
│       │   ├── TopProducts.tsx          # Best-selling products with progress bars
│       │   └── LiveOrders.tsx           # Live-like recent orders feed
│       └── types.ts
│
├── hooks/                  # Global hooks
│   ├── useTheme.ts         # Dark/Light theme manager
│   ├── useSidebar.ts       # Sidebar responsive collapse state
│   └── useDebounce.ts
│
├── utils/                  # Reusable helper functions
│   ├── cn.ts               # Tailwind class merge helper
│   ├── formatCurrency.ts   # ₹/localized currency formatting
│   ├── formatDate.ts
│   └── storage.ts
│
├── styles/
│   └── globals.css         # Customized Tailwind v4 configuration variables
│
├── main.tsx
└── vite-env.d.ts
```

---

## Technical Design Details

### 1. Reusable Layout and Navigation Configurations
- **No hardcoding**: The sidebar is populated entirely from `sidebar.config.ts`.
- **Portability**: To reuse in another project, a developer only needs to copy the
  `components/layout/`, `components/ui/`, `hooks/`, `utils/`, and `styles/`
  directories, then change `sidebar.config.ts` and the routes.
- **Strict Shadow-less Aesthetic**: Visual hierarchy is built using clean thin
  borders (`border border-neutral-200 dark:border-neutral-800`), contrasting
  backgrounds (`bg-neutral-50 dark:bg-neutral-900/50`), and modern typography
  (Outfit/Inter-like styles). Shadows are disabled (`shadow-none`) and border radii
  use **`rounded-md` (6px) project-wide** (decided — see
  [02-design-system.md](./02-design-system.md)).

### 2. Custom Responsive Chart Components (Pure SVG)
To ensure the dashboard is extremely robust, has zero dependency weight, supports
seamless zoom in/out, works flawlessly on React 19, and matches the reference design
perfectly, we build custom React SVG charts:
- **Sparkline Charts** (`StatsCard`): Lightweight `<svg>` elements with cubic-bezier
  paths (`d="..."`) and subtle gradients under the curve. Used on KPI cards
  (Revenue, Orders, Customers, Conversion).
- **Sales Chart** (`SalesChart`): Fully responsive dual-series line chart (e.g.
  Revenue vs. Orders, or this period vs. last period) using SVG paths, text nodes
  for axis labels, gridlines, and interactive hover tooltips using local state.
  2px strokes, no gradient fills.
- **Category Distribution** (`CategoryDistribution`): SVG donut chart using
  stroke-dasharray/stroke-dashoffset to draw accurate category segments, with a
  legend that updates on hover. (Doc 05 also mentions a treemap; the donut is the
  simpler first pass — either satisfies "category distribution".)
- **Order Status Chart** (`OrderStatusChart`): Double-layered radial SVG progress
  rings showing Delivered, Shipped, Pending/Processing, and Cancelled orders, with
  the total order count dynamically centered in the middle.

### 3. Theme & State Management
- **Theme Switcher**: Supported via standard React Context, which sets the `dark`
  class on the root `<html>` element. Light and Dark colors are fully wired into
  Tailwind v4 color schemes, using the tokens from
  [02-design-system.md](./02-design-system.md).
- **Zoom & Window Resize**: Layout uses fluid flexboxes and CSS grids with
  responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`), making it work beautifully on
  browser zoom and resizing.

---

## Proposed Changes

### Configuration Files

#### [MODIFY] `frontend/vite.config.ts`
Add alias resolver for `@` pointing to `./src`.

#### [MODIFY] `frontend/tsconfig.app.json`
Configure `paths` mapping `@/*` to `./src/*`.

### Global Styling & Utilities

#### [MODIFY] `frontend/src/index.css`
Include any global reset, wire the design tokens (light + `.dark`) for Tailwind v4.

#### [NEW] `frontend/src/utils/cn.ts`
Class merging utility using `clsx` and `tailwind-merge`.

#### [NEW] `frontend/src/utils/storage.ts`
Type-safe local storage helper for theme state and layout configuration.

#### [NEW] `frontend/src/utils/formatCurrency.ts`
Currency/number formatting (₹ + locale-aware) for KPI cards, tables, and charts.

### Providers & Theme Hooks

#### [NEW] `frontend/src/hooks/useTheme.ts`
Theme hook and provider context.

#### [NEW] `frontend/src/hooks/useSidebar.ts`
Sidebar control context (responsive collapse state).

#### [NEW] `frontend/src/app/providers.tsx`
Wraps layout and components in necessary providers (Theme, Sidebar).

### Generic UI Package (`src/components/ui/`)

#### [NEW] `Button.tsx`
Reusable styled button (primary black / secondary bordered / danger), no-shadow, flat border-based UI.

#### [NEW] `Input.tsx`
Form input with flat borders, 1px info-blue focus border (no glow).

#### [NEW] `Modal.tsx`
Clean dialog box — 1px border, `rounded-md`, no shadow, dimmed backdrop.

#### [NEW] `Dropdown.tsx`
Reusable context/action dropdown.

#### [NEW] `Tooltip.tsx`
Hover tooltip.

#### [NEW] `Badge.tsx`
Status badge (success/warning/danger/info/neutral) — the only consistently colored element.

#### [NEW] `index.ts`
Barrel export.

### Shell Layout Package (`src/components/layout/`)

#### [NEW] `Sidebar/types.ts`
TypeScript typings for the sidebar configuration.

#### [NEW] `Sidebar/sidebar.config.ts`
Reusable list of sidebar menu links, groups, and icons — **ecommerce nav**:
Dashboard, Products, Orders, Customers, Reports, Users & Roles, Settings.

#### [NEW] `Sidebar/SidebarItem.tsx`
Visual list items mapping paths (graphite row, white-pill active state).

#### [NEW] `Sidebar/SidebarGroup.tsx`
Menu sections container.

#### [NEW] `Sidebar/Sidebar.tsx`
Collapsible graphite sidebar with logo, badge, menu items, visual footer graphics, and active user card.

#### [NEW] `Navbar/SearchBar.tsx`
Top search bar matching "Search anything... ⌘ K" (also opens the command palette).

#### [NEW] `Navbar/Notification.tsx`
Bell icon with red status dot / badge and dropdown contents.

#### [NEW] `Navbar/UserMenu.tsx`
Avatar component with dropdown settings.

#### [NEW] `Navbar/ThemeToggle.tsx`
Theme button with Sun/Moon icons.

#### [NEW] `Navbar/Navbar.tsx`
Top navigation (64px, bottom border only) containing Breadcrumb, SearchBar, ThemeToggle, Notification, and UserMenu.

#### [NEW] `MainLayout.tsx`
App layout putting Navbar and Sidebar together around the routed content.

### Business Feature Components (`src/features/dashboard/`)

#### [NEW] `StatsCard.tsx`
KPI metrics (Revenue, Orders, Customers, Conversion, Avg. Order Value) with delta badge + colorized SVG sparkline.

#### [NEW] `SalesChart.tsx`
Custom dual-line SVG chart (Revenue / Orders) with points, hover tooltips, and horizontal gridlines.

#### [NEW] `CategoryDistribution.tsx`
Custom SVG donut chart of sales share by category, with legend and hover effects.

#### [NEW] `OrderStatusChart.tsx`
Custom SVG radial chart displaying total orders and status breakdown (Delivered, Shipped, Pending, Cancelled).

#### [NEW] `RecentActivity.tsx`
List of mock order/customer events with custom status badges.

#### [NEW] `TopProducts.tsx`
Best-selling products with units-sold / revenue progress bars.

#### [NEW] `LiveOrders.tsx`
Live-like recent orders feed (🟢 John purchased iPhone · 2 sec ago) — realtime-ready.

#### [NEW] `Dashboard.tsx`
The unified dashboard workspace: KPI row → Sales chart → Order status + Category donut → Recent activity / Top products / Live orders.

### Routing & App Mounting

#### [NEW] `src/routes/routes.tsx`
React Router config maps `/` to `MainLayout` with a sub-route pointing to the Dashboard feature (and stubs for Products, Orders, Customers, etc.).

#### [MODIFY] `src/App.tsx`
Re-wire index to mount Providers and Router.

---

## Verification Plan

### Automated Verification
1. Install dependencies:
   - `npm install lucide-react clsx tailwind-merge react-router-dom`
2. Run build step:
   - `npm run build`
   to ensure zero TypeScript compilation errors or build problems.

### Manual UI Verification
1. Run local dev server:
   - `npm run dev`
2. Verify layout responsiveness (collapses nicely on mobile, resizes cleanly on
   zoom-in/out).
3. Test Light & Dark theme toggles.
4. Interact with the dashboard, verifying that all charts render correctly, legends
   respond, and search/notification elements toggle correctly.

---

## Reconciliation with the rest of these docs

| This plan | The rest of the docs | Status |
|-----------|----------------------|--------|
| Border radius `rounded-md` (6px) | `rounded-md` (6px) everywhere | ✅ Aligned |
| Frontend workspace `frontend/` | `frontend/` (docs 01/04) | ✅ Aligned; `backend/` holds the NestJS API |
| Pure hand-rolled SVG charts (zero deps) | Recharts / visx | Either works; pure SVG chosen here for portability + zoom. Keep it if you value zero-dependency |
| React Context for all client state | React Context (docs 01/04) | ✅ Aligned — no Zustand; dock/panel/cart use Context + `useReducer` |

Everything else (shadow-less aesthetic, border-based hierarchy, portable layout,
dark mode via `.dark` on `<html>`, ecommerce dashboard widgets) is fully consistent
with the design system and module docs. This plan covers **Phase 1–2 + a first cut
of Phase 6** in [09-roadmap.md](./09-roadmap.md).
