# 19 · Brand & Vendor Management System

This document outlines the architecture, data models, API endpoints, permissions, and UI design for the **Brand & Vendor Management** module (Phase 6 of the enterprise roadmap).

---

## 1. Executive Summary

Brands and Vendors represent key domain pillars for catalog organization, supplier tracking, and multi-vendor eCommerce management:

- **Brands**: Allows organizing products by manufacturer/label (e.g. Apple, Nike, Sony). Powers brand filter chips on the customer storefront, brand landing pages, featured brand banners, and SEO metadata.
- **Vendors**: Tracks product suppliers, distributors, or 3rd-party marketplace sellers (e.g. Acme Supplies, TechDistro Ltd). Stores vendor contact details, vendor code, commission rate percentages, and supply status.

---

## 2. Data Models & Schemas

### Brand Schema (`Brand`)

```typescript
export interface Brand {
  _id: string;              // UUID v4
  name: string;             // e.g. "Apple"
  slug: string;             // Unique slug e.g. "apple"
  logo?: string;            // Image URL (via ImageUploader)
  banner?: string;          // Banner image URL
  website?: string;         // Official website URL
  description?: string;     // Brand overview
  isActive: boolean;        // Default true
  isFeatured: boolean;      // Default false
  metaTitle?: string;       // SEO
  metaDescription?: string; // SEO
  productCount: number;     // Aggregated count of assigned products
  createdAt: Date;
  updatedAt: Date;
}
```

### Vendor Schema (`Vendor`)

```typescript
export enum VendorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export interface Vendor {
  _id: string;              // UUID v4
  name: string;             // Company / Supplier name
  code: string;             // Unique vendor code e.g. "VND-1001"
  contactName?: string;     // Primary contact person
  email?: string;           // Contact email
  phone?: string;           // Contact phone number
  address?: string;         // Physical / billing address
  website?: string;         // Website URL
  commissionRate: number;   // Percentage (0 - 100%, default 0)
  status: VendorStatus;     // Default ACTIVE
  notes?: string;           // Internal notes
  productCount: number;     // Aggregated count of supplied products
  createdAt: Date;
  updatedAt: Date;
}
```

### Product Relation Embeddings (`Product`)

The `Product` schema includes optional foreign UUID references:

```typescript
export interface Product {
  // ... existing product fields ...
  brandId?: string;  // Ref: Brand._id
  vendorId?: string; // Ref: Vendor._id
}
```

---

## 3. REST API Endpoints

### Brands Endpoints (`/brands`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| `GET` | `/brands` | List brands (paginated, search, status, featured filters, sorting) | Public / `brands.read` |
| `GET` | `/brands/stats` | Brand KPI metrics (Total, Active, Featured, Products) | `brands.read` |
| `GET` | `/brands/:id` | Get brand details | `brands.read` |
| `POST` | `/brands` | Create new brand (auto-generates slug) | `brands.write` |
| `PATCH` | `/brands/:id` | Update brand details | `brands.write` |
| `DELETE` | `/brands/:id` | Delete brand (detaches attached products) | `brands.write` |

### Vendors Endpoints (`/vendors`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| `GET` | `/vendors` | List vendors (paginated, search, status filters, sorting) | `vendors.read` |
| `GET` | `/vendors/stats` | Vendor KPI metrics (Total, Active, Pending, Supplied Products) | `vendors.read` |
| `GET` | `/vendors/:id` | Get vendor details | `vendors.read` |
| `POST` | `/vendors` | Create new vendor (enforces unique code) | `vendors.write` |
| `PATCH` | `/vendors/:id` | Update vendor details | `vendors.write` |
| `DELETE` | `/vendors/:id` | Delete vendor | `vendors.write` |

---

## 4. Permissions & RBAC Matrix

The following permission resources are registered in `PERMISSION_RESOURCES`:

```typescript
{ resource: 'brands.read', label: 'View Brands', description: 'Can view brands list and metrics' },
{ resource: 'brands.write', label: 'Manage Brands', description: 'Can create, edit, and delete brands' },
{ resource: 'vendors.read', label: 'View Vendors', description: 'Can view vendors list and metrics' },
{ resource: 'vendors.write', label: 'Manage Vendors', description: 'Can create, edit, and delete vendors' },
```

Admin and Super Admin roles automatically receive these permissions during seed / update.

---

## 5. Frontend UI Design & Components

### Brands Management Page (`/brands`)
- **Stat Cards Row**: Total Brands, Active Brands, Featured Brands, Total Products attached.
- **Filter Bar**: Search input (by name/slug), Status filter (`ALL`, `ACTIVE`, `INACTIVE`), Featured toggle, Sort order.
- **Brand Cards & Grid/Table**: Displays Brand Logo thumbnail, Name + Slug, Website link, Product Count badge, Featured badge, Status badge, and Kebab Row Actions (Edit, Delete, Toggle Featured).
- **Brand Editor Drawer** (`BrandEditorDrawer`): Slide-over drawer form with logo/banner image uploader, name, auto-slug, website, description, featured/active toggles, and SEO meta fields.

### Vendors Management Page (`/vendors`)
- **Stat Cards Row**: Total Vendors, Active Vendors, Pending Approval, Total Products Supplied.
- **Filter Bar**: Search input (by name, code, email), Status filter, Sort order.
- **Vendors Table**: Code, Vendor Name & Contact Person, Email & Phone, Commission Rate %, Product Count, Status Badge, Row Actions.
- **Vendor Editor Drawer** (`VendorEditorDrawer`): Slide-over drawer form for vendor details, contact info, commission %, and status management.

### Product Editor Integration
- In the Product Editor page (`/products/new`, `/products/:id/edit`), the **Organization** section includes:
  - **Brand Picker**: Single-select dropdown loading active brands.
  - **Vendor Picker**: Single-select dropdown loading active vendors.
- In the Products List page (`/products`), Brand & Vendor badges appear on product rows, and filter dropdowns allow filtering products by brand or vendor.
