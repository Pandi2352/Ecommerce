# 18 · Product Attributes, Options & Variants

How NovaShop supports **any type of shop** (fashion, footwear, electronics, …)
from one codebase: the admin configures the **product fields** their shop needs,
and the product form renders from that configuration. This is the design spec for
extending the [Products module](./05-modules.md) — write it before building.

> Aligns with: **copy-friendly / white-label** (clone → pick a preset → reseed →
> a different shop) and the **single-tenant** model (one shop per deployment).
> Builds on Products v1 (already shipped: `name, slug, sku, price, compareAtPrice,
> category, images, status, stock, tags, featured`).

---

## 1. The core principle — two different things

"Custom fields" is really **two** concepts with different behavior. Conflating
them is the classic mistake; we model them separately.

| | **A. Attributes** (descriptive) | **B. Variant options** (purchasable) |
|---|---|---|
| Examples | material, fit, gender, warranty, screen size | size, color |
| Cardinality | one value per product | each combination is its own SKU |
| Stock/price | n/a (product-level) | **per variant** (Size M / Red has its own stock, price, image) |
| Storefront | filters & spec table | the buy-box selector (dropdowns/swatches) |
| Admin config | "Product fields" definitions | "Variant options" the product uses |

A dress in 3 sizes × 4 colors = **12 variants**, each independently stocked. If
`size` were a plain attribute you couldn't track stock per size — which defeats
the purpose. So both systems are first-class.

## 2. Fixed core fields (always present)

Every product, in every shop, keeps these — they are **not** configurable:

`name` · `slug` · `sku` · `description` · `status` (DRAFT/ACTIVE/ARCHIVED) ·
`images[]` · `category` · base `price` · `compareAtPrice?` · `stock` (simple
products) · `featured` · `tags[]`.

Everything shop-specific lives in **attributes** and **variants** below.

## 3. Attribute definitions (`AttributeDefinition`)

The admin-defined "fields". One collection drives the dynamic product form,
validation, and (later) storefront filters.

```ts
AttributeDefinition {
  _id: string;              // uuid
  key: string;              // stable machine key, e.g. "material" (unique)
  label: string;            // "Material"
  type: AttributeType;      // see below
  options?: string[];       // for select / multiselect
  unit?: string;            // "cm", "g", "inch"
  group?: string;           // form section, e.g. "Specs", "Care"
  required: boolean;
  filterable: boolean;      // expose as a storefront filter
  appliesTo: 'all' | { categoryIds: string[] };  // scoping (see §6)
  sortOrder: number;
  isActive: boolean;
}
```

**`AttributeType`:** `text` · `textarea` · `number` · `boolean` · `select` ·
`multiselect` · `date` · `url`. (Extensible — e.g. `color`, `richtext` later.)

## 4. Variant options & the variant matrix

- On a product, the admin picks the **option axes** that apply and their values:
  `options: [{ name: 'Size', values: ['S','M','L'] }, { name: 'Color', values: ['Red','Blue'] }]`.
- The system **generates the cartesian matrix** of variants; the admin fills in
  per-variant data:
  `variants: [{ sku, optionValues: { Size:'M', Color:'Red' }, price, stock, image?, barcode? }]`.
- A product with **no options** is a *simple product* — it just uses the core
  `price`/`stock`. Options are opt-in per product.
- Option axes are suggested by the shop preset (§7) but chosen per product.

Rules: adding an option value regenerates the matrix (keep existing variants,
add new combos); removing a value soft-removes its variants (confirm if they have
stock/orders later).

## 5. Product document shape (extended)

```ts
Product {
  // ── fixed core (v1) ──
  name, slug, sku?, description?, status, images[], category?,
  price, compareAtPrice?, stock, featured, tags[],

  // ── A. descriptive attributes (validated against definitions) ──
  attributes: { [key: string]: string | number | boolean | string[] | Date },

  // ── B. variant options + generated matrix ──
  options:  [{ name: string; values: string[] }],
  variants: [{
    id, sku?, optionValues: Record<string,string>,
    price, stock, image?, barcode?, isActive
  }],
}
```

Embedded (not referenced): attributes, options and variants are owned by the
product — perfect for MongoDB documents (see [07 · Data Model](./07-data-model.md)).
No EAV value tables; the flexible `attributes` object is validated at write time.

## 6. Scoping — global vs per-category

Even one shop has mixed catalogs (a fashion store sells dresses *and* handbags).
`AttributeDefinition.appliesTo` supports:

- `all` — every product (start here; simplest).
- `{ categoryIds }` — only products in those categories (dresses → Size+Color+Fit;
  bags → Material+Dimensions).

Build `appliesTo` in from day one (cheap), default everything to `all`, and turn
on per-category sets when needed — **no migration required later**. The product
form fetches the definitions relevant to the selected category.

## 7. Shop presets (the white-label magic)

On setup, the admin picks a preset that **seeds attribute definitions + suggested
variant options**. Editable afterward. Presets ship as data (extend freely):

| Preset | Variant options | Sample attributes |
|--------|-----------------|-------------------|
| **Fashion / Apparel** | Size, Color | material, fit, gender, pattern, care |
| **Footwear** | Size (+ Width) | material, gender, closure, sole |
| **Electronics** | Color, Storage | brand, model, warranty, power, dimensions |
| **Grocery / FMCG** | Size/Weight, Pack | brand, expiry, ingredients, nutrition |
| **Blank** | — | (admin builds their own) |

Clone the repo → choose preset → reseed → a different shop. Ties directly to the
copy-friendly goal.

## 8. Admin flow

1. **Configure once** — *Settings → Product fields*: pick a preset (or Blank),
   then add/edit/reorder attribute definitions and the option axes the shop uses.
2. **Create a product** — the form renders **dynamically**:
   - core fields (always),
   - the shop's attribute inputs (typed, grouped, required-aware),
   - a *"This product has variants?"* toggle → choose option axes + values →
     the variant table is generated for per-variant price/stock/SKU/image.
3. Simple product = skip the variant step.

## 9. Validation

On every product write the API validates `attributes` against the definitions:
- unknown keys rejected; `required` enforced; `select`/`multiselect` values must
  be within `options`; `number`/`date`/`boolean`/`url` coerced & checked.
- `variants[].optionValues` must match the product's declared `options`.
Shared validators/types in `packages/shared` so the client form and the API agree.

## 10. Storefront implications (later)

- `filterable` attributes + option axes power faceted **filtering/search**.
- Variant selection drives the buy-box (dropdowns / color swatches).
- List/detail endpoints project the right fields; cart/orders reference a
  specific **variant id**, not just the product.

## 11. New collections / model additions

- **`attributes`** (new) — `AttributeDefinition` documents (§3).
- **`settings`** (extend) — chosen `shopPreset`; optional per-category attribute
  set mapping.
- **`products`** (extend) — `attributes{}`, `options[]`, `variants[]` (§5).
- New permission resource **`attributes`** (`attributes.read` / `.write`) in the
  [permissions catalog](../packages/shared/src/permissions.ts) for the *Product fields* page.

## 12. API surface

- `GET/POST/PATCH/DELETE /attributes` (`attributes.*`) — manage definitions.
- `GET /attributes?category=<id>` — definitions applicable to a category (drives the form).
- `POST /settings/apply-preset` (`settings.write`) — seed a shop preset's definitions/options.
- Products endpoints accept/validate `attributes`, `options`, `variants`.

## 13. Build order

1. ✅ **`attributes` module** — definitions CRUD + `attributes.*` permission + *Product
   Fields* admin page (typed field editor, grouping, scoping). **Done.**
2. ✅ **Shop presets** — catalog + `GET /attributes/presets` + `POST /attributes/apply-preset`
   (idempotent seeder; Fashion/Footwear/Electronics/Grocery/Blank). **Done.**
3. ✅ **Dynamic product form** — the product create/edit form renders the applicable
   attribute inputs (by type, grouped, category-scoped) and the API validates `attributes{}`
   against the definitions. **Done.**
4. ✅ **Variant options + matrix** — options editor → "Generate variants" (cartesian) →
   per-variant SKU/price/stock; validated so variant option-values match the product's options. **Done.**
5. **Storefront filtering** (later) — facets from `filterable` attributes + options.

> Shipped in stages 1–4: `modules/attributes` (schema, CRUD, presets) + `attributes`
> permission + **Product Fields** page; and on products — `attributes{}`, `options[]`,
> `variants[]` on the schema, server-side validation, and a dynamic product editor
> (Basics · Product fields · Variants). Only storefront filtering (§10) remains.

> As pieces land, update [`docs/sprint-plan.csv`](./sprint-plan.csv) and extend
> `packages/shared` (attribute types + the `attributes` permission).
