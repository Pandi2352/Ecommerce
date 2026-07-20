# Enterprise eCommerce Platform — Documentation

A production-grade eCommerce platform (a mix of **Shopify, Amazon Seller Central,
and WooCommerce**) spanning a polished **admin panel** and a full **customer
storefront**, capped with **AI features**. Built as a learning-first project across a
**30-phase roadmap**. The admin UI aims to feel like **Linear, Vercel, GitHub, and
Stripe** — clean, border-based, information-dense — not the typical "blue cards with
shadows everywhere" template.

**Stack:** Vite + React 19 + TypeScript + Tailwind (frontend) · NestJS + MongoDB
(Mongoose) (backend; Redis/BullMQ later) · Docker/Nginx/CI-CD (devops) · Claude (AI)

---

## How to read these docs

Read them in order for the full picture, or jump to what you need.

| # | Document | What's inside |
|---|----------|---------------|
| 00 | [Project Overview](./00-project-overview.md) | Vision, goals, scope, success criteria, personas |
| 01 | [Tech Stack](./01-tech-stack.md) | Every library chosen, and *why* |
| 02 | [Design System](./02-design-system.md) | Principles, color tokens, typography, spacing, dark mode |
| 03 | [Component Library](./03-component-library.md) | Every UI primitive: buttons, inputs, tables, badges, dialogs |
| 04 | [Architecture](./04-architecture.md) | Folder structure, frontend + backend architecture, data flow |
| 05 | [Modules](./05-modules.md) | Full feature module list with responsibilities |
| 06 | [Signature Features](./06-signature-features.md) | Workspace Dock, Right Context Panel, Command Palette, widgets |
| 07 | [Data Model](./07-data-model.md) | Collections, relationships, Mongoose schema sketch |
| 08 | [API Conventions](./08-api-conventions.md) | REST conventions, auth, pagination, errors, realtime |
| 09 | [Roadmap](./09-roadmap.md) | Phase-by-phase delivery plan with checklists |
| 10 | [Frontend Implementation Plan](./10-implementation-plan.md) | `frontend/`: reusable UI framework + ecommerce dashboard — folder tree, per-file change list, verification |
| 11 | [Backend Implementation Plan](./11-backend-implementation-plan.md) | `backend/`: NestJS API — module tree, endpoints, auth/RBAC, MongoDB/Mongoose, per-file change list, verification |
| 12 | _Getting Started_ (planned) | Setup + run guide: install, MongoDB, `.env`, run both apps, seed — reserved slot |
| 13 | [Coding Conventions](./13-coding-conventions.md) | Naming, folder rules, styling, React/Nest patterns, git workflow, PR checklist |
| 14 | [Docker & Deployment](./14-docker-deployment.md) | Docker primer, separate FE/BE images, compose, command reference, deploying independently |
| 15 | [AI Features](./15-ai-features.md) | Phase 30: generators, RAG assistant, recommendations, forecasting + AI architecture |
| 16 | [Advanced Features](./16-advanced-features.md) | 50 enterprise/stretch feature plans beyond the 30 phases |
| 17 | [Admin, Access & Identity](./17-admin-access-management.md) | Admin management + authentication + authorization: current state + prioritized feature backlog |
| 18 | [Product Attributes & Variants](./18-product-attributes.md) | Admin-configurable product fields + variant matrix so one codebase fits any shop type |

---

## Quick reference — the non-negotiables

**Design DNA**

- ❌ No shadows — separation comes from **1px borders**
- ✅ `rounded-md` (6px) everywhere
- ✅ 8px spacing grid
- ✅ Neutral background, colored accents **only where needed** (badges, focus, status)
- ✅ Information density like Linear / Vercel / GitHub / Stripe

**Two signature interactions that set this panel apart**

1. **Workspace Dock** — browser-style tabs at the top; open multiple modules
   (Dashboard, Products, Order #1256, Customer John) and switch instantly without
   losing state.
2. **Right Context Panel** — clicking a table row slides in a detail panel from the
   right instead of navigating away. Faster admin workflow.

---

## Status

Documentation phase. No application code exists yet — see the
[Roadmap](./09-roadmap.md) for the build sequence.
