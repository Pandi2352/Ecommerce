# 16 · 50 Advanced Feature Plans

Beyond the 30 core phases in [09-roadmap.md](./09-roadmap.md), these are the
advanced, differentiating features that push the platform toward true enterprise
SaaS (Shopify Plus / Amazon-scale territory). Treat this as a **backlog** — pick
what fits your learning goals; each names the concept it teaches.

Legend: 🧠 concept · ⚡ realtime/jobs · 🧠🤖 AI-assisted

---

## A. Multi-tenancy & marketplace (1–8)

1. **Multi-vendor marketplace** — vendor onboarding, per-vendor storefronts. 🧠 tenant isolation
2. **Vendor payouts & commissions** — split payments, payout schedules, statements. 🧠 ledgers
3. **Vendor analytics dashboard** — per-vendor sales/inventory views. 🧠 scoped queries
4. **Multi-store / multi-brand** — one backend, many storefronts. 🧠 config-per-tenant
5. **Multi-currency** — live FX, per-region pricing, rounding rules. 🧠 money handling
6. **Multi-language (i18n)** — translated catalog + UI, locale routing. 🧠 i18n
7. **Multi-warehouse routing** — fulfil from nearest stock. 🧠 geo logic
8. **Franchise/branch management** — per-branch inventory & staff. 🧠 org hierarchy

## B. Merchandising & catalog (9–17)

9. **Product bundles & kits** — sell grouped SKUs, bundle pricing. 🧠 composite products
10. **Configurable/made-to-order products** — dynamic price by options. 🧠 pricing rules
11. **Subscriptions & recurring billing** — plans, renewals, dunning. 🧠 recurring payments
12. **Pre-orders & backorders** — sell before stock arrives. 🧠 stock states
13. **Digital downloads & licenses** — secure delivery, license keys. 🧠 entitlements
14. **Product Q&A** — customer questions + vendor answers. 🧠 moderation
15. **Size charts & fit guides** — per-category attributes. 🧠 flexible schema
16. **Dynamic/rule-based pricing** — tiered, quantity, customer-group pricing. 🧠 rule engine
17. **Price history & drop alerts** ⚡ — track + notify on price changes. 🧠 change feeds

## C. Growth, loyalty & marketing (18–26)

18. **Loyalty points & tiers** — earn/redeem, tier benefits. 🧠 points ledger
19. **Store credit & gift cards** — balances, expiry, transfer. 🧠 wallet
20. **Affiliate/referral program** — tracking links, attribution, payouts. 🧠 attribution
21. **Abandoned-cart recovery** ⚡ — scheduled email/push nudges. 🧠 lifecycle jobs
22. **A/B testing framework** — experiment on UI/pricing/copy. 🧠 experimentation
23. **Personalized storefront** 🧠🤖 — per-user home/ordering. 🧠 personalization
24. **Bundling recommendations** 🧠🤖 — "frequently bought together." 🧠 market-basket
25. **Email/SMS automation flows** — visual journey builder. 🧠 workflow engine
26. **Social commerce** — Instagram/WhatsApp catalog sync. 🧠 external APIs

## D. Checkout, payments & finance (27–34)

27. **One-click / express checkout** — saved payment + address. 🧠 tokenization
28. **Buy-now-pay-later** — Klarna/Affirm-style integrations. 🧠 3rd-party credit
29. **Split payments & partial refunds** — multi-tender, itemized refunds. 🧠 payment ops
30. **Tax engine (GST/VAT/US sales tax)** — jurisdiction rules, exemptions. 🧠 tax compliance
31. **Invoicing & credit notes** — PDF, sequential numbering, GST fields. 🧠 accounting
32. **Fraud detection** 🧠🤖 — risk scoring on orders. 🧠 anomaly detection
33. **Reconciliation** — match gateway payouts to orders. 🧠 finance ops
34. **Dropshipping / supplier orders** — auto-forward POs. 🧠 integration

## E. Fulfilment & operations (35–40)

35. **Returns & RMA portal** — self-service returns, labels, refunds. 🧠 reverse logistics
36. **Barcode/QR picking & packing** — warehouse scan flow. 🧠 ops tooling
37. **Shipment tracking hub** ⚡ — unified multi-carrier tracking + webhooks. 🧠 webhooks
38. **Delivery slots & scheduling** — time-window selection. 🧠 scheduling
39. **Store pickup (BOPIS)** — buy online, pick up in store. 🧠 omnichannel
40. **Purchase-order & supplier management** — restock workflow. 🧠 procurement

## F. Platform, extensibility & DX (41–46)

41. **Public REST/GraphQL API + API keys** — let 3rd parties build. 🧠 API productization
42. **Webhooks system** ⚡ — subscribable events for integrators. 🧠 event delivery
43. **Plugin/extension architecture** — app marketplace hooks. 🧠 extensibility
44. **Feature flags** — gradual rollout, kill switches. 🧠 progressive delivery
45. **Themes & storefront builder** — drag-drop page builder (React DnD). 🧠 low-code UI
46. **Import/export & migrations** — Shopify/WooCommerce importers. 🧠 data migration

## G. Enterprise, trust & intelligence (47–50)

47. **RBAC++ with custom roles & scopes** — granular permission builder. 🧠 authz depth
48. **Audit trail & compliance (GDPR)** — data export/erase, consent. 🧠 compliance
49. **Real-time ops dashboard** ⚡ — live orders/traffic/inventory board. 🧠 streaming UI
50. **Business intelligence & forecasting** 🧠🤖 — cohorts, LTV, churn, demand. 🧠 BI

---

## How to use this list

- **Don't build all 50.** Each is a mini-project; choose ~5–10 that teach concepts
  you want (payments depth, personalization, multi-tenancy…).
- **Sequence after the core 30.** Most assume products, orders, payments, and search
  already exist.
- **AI-tagged (🧠🤖)** items build on [15-ai-features.md](./15-ai-features.md).
- For anything you commit to, run the full SaaS checklist from
  [09-roadmap.md](./09-roadmap.md#treat-it-like-a-real-saas-product).
