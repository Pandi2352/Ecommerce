# 00 · Project Overview

## Vision

Build a **production-grade enterprise eCommerce platform** — a mix of **Shopify,
Amazon Seller Central, and WooCommerce** — spanning both a polished **admin panel**
and a full **customer storefront**, capped with **AI features**. The goal is
**learning**: by the end you'll understand how large SaaS applications are built
end-to-end.

Two things set it apart:

1. **Enterprise depth** — real auth/RBAC, products/variants/inventory, cart/checkout/
   payments, orders/shipping, marketing, search, reporting, security, and deployment.
2. **UI quality** — an admin experience that feels like **Linear, Vercel, GitHub,
   Stripe, and Notion**: fast, dense, calm, border-based. No shadows, no gradients.

Explicitly **not** the reference: generic admin templates with gradient cards, drop
shadows everywhere, and neon accents.

## Goals — skills to master

React + TypeScript · Tailwind · NestJS · MongoDB/Mongoose · Authentication &
Authorization · State management · API design · Performance · Scalability ·
Security · Background jobs (BullMQ) · Caching (Redis) · Search · Clean architecture ·
Docker/CI-CD · Production deployment · **AI integration**.

The build is organized as a **30-phase learning roadmap** where each phase teaches
one new concept — see [09-roadmap.md](./09-roadmap.md).

## Scope

**In scope**

- **Admin panel** — dashboard, catalog (products, categories, brands, variants,
  inventory), coupons, orders, payments, shipping, customers, reviews, CMS,
  marketing, reports, analytics, settings, notifications, search.
- **Customer storefront** — home, catalog/search/filters, product pages, cart,
  checkout, order history, wishlist, profile, reviews.
- **Platform** — auth/RBAC, file/media management, logging/audit, security
  hardening, background jobs, caching.
- **AI** — generators, RAG assistant, recommendations, forecasting
  ([15-ai-features.md](./15-ai-features.md)).
- **DevOps** — Docker, Nginx, PM2, SSL, GitHub Actions, VPS/Cloudflare.

**Out of scope (for now)** — native mobile apps (the web is responsive); the 50
stretch items in [16-advanced-features.md](./16-advanced-features.md) are an
optional backlog, not v1.

## Primary personas

| Persona | Needs |
|---------|-------|
| **Customer / Shopper** | Browse, search, filter, add to cart, checkout, track orders, review |
| **Store Operator** | Fulfil orders fast, check stock, update statuses, minimal clicks |
| **Merchandiser** | Manage products, categories, brands, variants, pricing, images |
| **Marketer** | Coupons, campaigns, flash sales, CMS, newsletters |
| **Analyst / Owner** | Dashboards, revenue goals, reports, AI insights |
| **Admin** | Users, roles, permissions, settings, security, audit logs |

## Success criteria

- End-to-end commerce works: a shopper can go from **browse → cart → checkout →
  payment → order → tracking**, and an admin can manage the full catalog and fulfil
  that order.
- **Admin UI** passes the "screenshot test" — looks like it belongs next to
  Linear/Vercel; zero `box-shadow`; full dark mode via token flip.
- Signature admin workflow: open Products, an Order, and a Customer as **separate
  dock tabs**; row click opens the **right panel** in <150ms.
- Production-ready: containerized, secured (Helmet/rate-limit/validation), observable
  (logs/audit), and deployable via CI/CD.
- At least the **core AI generators + one RAG feature** shipped.

## Scope summary (module groups)

Auth · Users · Dashboard · Products · Categories · Brands · Variants · Inventory ·
Coupons · Cart · Checkout · Orders · Payments · Shipping · Storefront · Reviews ·
CMS · Marketing · Reports · Settings · Notifications · Search · Security · Files ·
Analytics · Logging · **AI** — plus the admin shell (Sidebar, Top Nav, Workspace
Dock, Command Palette, Right Context Panel).

See [05-modules.md](./05-modules.md) for the full breakdown and
[09-roadmap.md](./09-roadmap.md) for delivery order.
