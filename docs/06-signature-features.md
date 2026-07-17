# 06 · Signature Features

These are what make the panel feel distinctive rather than "another admin
template." Two are workflow features (Dock, Panel); the rest are polish that
compounds into a premium feel.

---

## 1. Workspace Dock

Browser / VS Code-style tabs pinned at the top. Admins open multiple modules at
once and switch instantly **without losing state**.

```
[Dashboard] [Products] [Order #1256] [Customer — John] [Analytics]        +
```

**Behavior**

- Opening a record (an order, a customer) opens or focuses a tab, it doesn't
  replace the current view.
- Each tab remembers its route, scroll position, filters, and form drafts.
- Tabs are reorderable (drag) and closable (`×`). `+` opens the command palette.
- Middle-click closes; ⌘/Ctrl+click opens in a new background tab.
- Persisted to `localStorage` so the workspace survives a reload.

**Implementation**

- `store/dock.tsx` (React Context + `useReducer`, persisted to `localStorage`) holds
  `tabs: { id, type, label, path, state }[]` and `activeTabId`.
- Views stay mounted (or are cheaply re-rendered from the Context data cache) so
  switching is instant.
- Tab labels come from the entity (`Order #1256`, `Customer — John`).

**Why it matters:** operators constantly jump between an order, the customer who
placed it, and the product involved. Tabs kill the back-button ping-pong.

---

## 2. Right Context Panel

Clicking any table row slides a detail panel in **from the right** instead of
navigating away.

```
Orders List                     │ Order Details
────────────────────────────────│──────────────────
Order #1001                     │ Customer
Order #1002   ◄ selected        │ Timeline
Order #1003                     │ Payment
                                │ Shipment
                                │ Notes
```

**Behavior**

- Row click → panel slides in (150ms), list stays visible and keeps its selection.
- Panel is resizable; `Esc` or backdrop-less outside click closes it.
- Content is module-specific: Order → timeline/payment/shipment; Product → tabs;
  Customer → profile/history.
- "Open as tab" button promotes the panel into a full Workspace Dock tab.
- Deep-linkable: `?panel=order:1001` so the state is shareable/reloadable.

**Implementation**

- `store/panel.tsx` (React Context) holds `{ open, type, id }`.
- The panel lazy-loads the matching detail component; the list response is already
  in the Context data cache, so it renders instantly.

**Why it matters:** triage speed. Scan a list, peek details, act — never lose the
list context.

---

## 3. Command Palette (⌘K / Ctrl+K)

Keyboard-first navigation and actions, `cmdk`-powered.

- Navigate: Go to Products / Orders / Customers / Settings.
- Act: Create Product, Create Order, toggle theme, open Settings.
- Search entities (fuzzy): jump straight to a product/order/customer, which opens
  it in the Right Context Panel or a new Dock tab.
- Styled to tokens: 1px border, `rounded-md`, no shadow, dimmed backdrop.

---

## 4. Dashboard widgets (not plain stats)

Covered in [05-modules.md](./05-modules.md#1-dashboard). The point: the dashboard is
made of purposeful widgets — GitHub-style **sales heatmap**, **live orders** feed,
**warehouse capacity bars**, **inventory gauge**, **AI restock recommendation**,
**circular revenue goal**, **category treemap** — all inside bordered containers,
no shadows, 2px chart lines.

---

## 5. Full dark mode

Not an afterthought — token-driven. Light and dark are the **same layout**; only
CSS variables flip via a `.dark` class on `<html>`. The graphite sidebar is
identical in both modes.

---

## 6. Polish details

- **Skeletons, never spinners.**
- **Toasts** slide top-right, small, bordered.
- **Empty states** with a one-line prompt + primary action.
- **Optimistic updates** on status changes (order → Packed) with rollback on error.
- **Keyboard navigation** in tables (↑/↓ to move selection, `Enter` to open panel).
