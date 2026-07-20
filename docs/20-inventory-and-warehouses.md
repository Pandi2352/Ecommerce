# 20 · Inventory & Multi-Warehouse Management System

This document outlines the architecture, data models, API endpoints, and UI design for the **Inventory & Multi-Warehouse Management System** (Phase 8 of the enterprise roadmap).

---

## 1. Executive Summary

Inventory management in enterprise eCommerce requires tracking stock across multiple physical locations, managing reservations for active orders, logging stock audit ledgers (purchases, damages, transfers), and providing real-time low-stock alerts:

- **Warehouses**: Manage multiple fulfilment centers, local stores, or distribution hubs.
- **Inventory Records**: Per-variant, per-warehouse physical `onHand` count, `reserved` quantity, and `available` (`onHand - reserved`) count.
- **Stock Ledger**: Immutable transaction log recording every stock movement with type, delta, reason, and actor ID.
- **Low-Stock Alerts**: Automatic calculation based on customizable thresholds per variant.

---

## 2. Data Models & Schemas

### Warehouse Schema (`Warehouse`)

```typescript
export interface Warehouse {
  _id: string;          // UUID v4
  name: string;         // e.g. "Main Fulfilment Center"
  code: string;         // Unique code e.g. "WH-MAIN"
  contactName?: string; // Primary manager contact
  email?: string;
  phone?: string;
  address?: string;     // Physical address
  isPrimary: boolean;   // Exactly one primary warehouse
  isActive: boolean;    // Status
  createdAt: Date;
  updatedAt: Date;
}
```

### Inventory Record Schema (`InventoryRecord`)

```typescript
export interface InventoryRecord {
  _id: string;              // UUID v4
  productId: string;        // Ref: Product._id
  variantSku: string;       // SKU identifier
  warehouseId: string;      // Ref: Warehouse._id
  onHand: number;           // Physical stock count
  reserved: number;         // Stock allocated to pending orders
  available: number;        // Computed: onHand - reserved
  lowStockThreshold: number;// Default: 5
  createdAt: Date;
  updatedAt: Date;
}
```

### Stock Adjustment Ledger Schema (`StockAdjustment`)

```typescript
export enum StockAdjustmentType {
  PURCHASE = 'PURCHASE',   // Stock arrival / purchase order
  TRANSFER = 'TRANSFER',   // Inter-warehouse transfer
  DAMAGE = 'DAMAGE',       // Write-off / damaged goods
  SALE = 'SALE',           // Fulfilled customer order
  ADJUSTMENT = 'ADJUSTMENT',// Manual stock count correction
  RETURN = 'RETURN',       // Customer return restock
}

export interface StockAdjustment {
  _id: string;               // UUID v4
  type: StockAdjustmentType; // Transaction type
  warehouseId: string;       // Source warehouse
  targetWarehouseId?: string;// Target warehouse (for transfers)
  productId: string;         // Product UUID
  variantSku: string;        // Variant SKU
  quantityDelta: number;     // +50 for restock, -2 for damage
  reason?: string;           // Note / PO reference
  adjustedBy: string;        // Actor User ID
  createdAt: Date;
}
```

---

## 3. REST API Endpoints

### Warehouses Endpoints (`/inventory/warehouses`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| `GET` | `/inventory/warehouses` | List all warehouses with item counts | `inventory.read` |
| `GET` | `/inventory/warehouses/:id` | Get warehouse details | `inventory.read` |
| `POST` | `/inventory/warehouses` | Create new warehouse | `inventory.write` |
| `PATCH` | `/inventory/warehouses/:id` | Update warehouse details | `inventory.write` |
| `PATCH` | `/inventory/warehouses/:id/primary` | Set primary warehouse | `inventory.write` |
| `DELETE` | `/inventory/warehouses/:id` | Delete warehouse (blocked if stock > 0) | `inventory.write` |

### Inventory Endpoints (`/inventory`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| `GET` | `/inventory` | List stock records (paginated, search SKU/name, warehouse filter, stock status) | `inventory.read` |
| `GET` | `/inventory/stats` | Stock metrics (Total On-Hand, Total Reserved, Low Stock Items, Out of Stock Items) | `inventory.read` |
| `GET` | `/inventory/low` | List items at or below low stock threshold | `inventory.read` |
| `POST` | `/inventory/adjust` | Record stock adjustment (updates `onHand` + logs transaction entry) | `inventory.write` |
| `POST` | `/inventory/transfer` | Transfer stock between two warehouses | `inventory.write` |
| `GET` | `/inventory/ledger` | Paginated transaction ledger history | `inventory.read` |

---

## 4. Frontend UI Pages & Components

1. **Stock Overview Page (`/inventory`)**:
   - Stat Cards: Total Stock On-Hand, Total Reserved, Low-Stock Items, Out of Stock.
   - Filter Bar: Search by name/SKU, Warehouse selector, Stock status selector (`ALL`, `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`).
   - Stock Table: Product Image/Title, SKU, Warehouse, On-Hand, Reserved, Available, Low-Stock Threshold, Status badge, Actions (`Adjust Stock`, `History`).

2. **Low Stock Dashboard (`/inventory/low`)**:
   - Filtered view of low stock items across warehouses with quick restock trigger.

3. **Warehouses Page (`/inventory/warehouses`)**:
   - Warehouse grid/table displaying Code, Name, Contact, Address, Item Count, Primary Badge, Status.
   - `WarehouseEditorDrawer` slide-over for creating/editing warehouses.

4. **Stock Adjustment Modal (`StockAdjustmentModal`)**:
   - Modal form supporting restock, damage write-off, manual adjustment, and inter-warehouse transfers.

5. **Stock History Drawer (`StockLedgerDrawer`)**:
   - Timeline panel displaying transaction ledger entries for a specific SKU.
