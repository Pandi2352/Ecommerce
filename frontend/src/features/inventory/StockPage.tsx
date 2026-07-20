import { useCallback, useEffect, useState } from 'react';
import { Boxes, AlertTriangle, XCircle, RefreshCw, SlidersHorizontal, History, Building2, Package } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  Table,
  type Column,
} from '@/components/ui';
import { StatCard } from '@/components/common/StatCard';
import type { Meta } from '@/lib/types';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { fetchInventory, fetchInventoryStats, fetchWarehouses } from './api';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { StockLedgerDrawer } from './components/StockLedgerDrawer';
import type { InventoryItem, InventoryStats, WarehouseItem } from './types';

export function StockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [stockStatus, setStockStatus] = useState<string>('ALL');
  const [sort, setSort] = useState('variantSku:asc');
  const [page, setPage] = useState(1);

  // Modals
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [ledgerItem, setLedgerItem] = useState<InventoryItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, statsRes, whRes] = await Promise.all([
        fetchInventory({
          page,
          pageSize: 15,
          search: search.trim() || undefined,
          warehouseId: warehouseId || undefined,
          stockStatus: stockStatus !== 'ALL' ? (stockStatus as any) : undefined,
          sort,
        }),
        fetchInventoryStats(),
        fetchWarehouses(),
      ]);
      setItems(invRes.data);
      setMeta(invRes.meta);
      setStats(statsRes);
      setWarehouses(whRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load inventory stock'));
    } finally {
      setLoading(false);
    }
  }, [page, search, warehouseId, stockStatus, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusBadge = (status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK') => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge tone="success">In Stock</Badge>;
      case 'LOW_STOCK':
        return <Badge tone="warning">Low Stock</Badge>;
      case 'OUT_OF_STOCK':
        return <Badge tone="danger">Out of Stock</Badge>;
    }
  };

  const columns: Column<InventoryItem>[] = [
    {
      key: 'product',
      header: 'Product & SKU',
      cell: (item) => (
        <div className="flex items-center gap-3">
          {item.productImage ? (
            <img
              src={item.productImage}
              alt=""
              className="h-9 w-9 rounded-md border border-border object-cover shrink-0"
            />
          ) : (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-bg text-text-secondary">
              <Package className="h-4 w-4" />
            </div>
          )}
          <div className="leading-tight">
            <p className="text-xs font-bold text-text">{item.productName}</p>
            <span className="font-mono text-[11px] font-semibold text-indigo-500">{item.variantSku}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Warehouse',
      cell: (item) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-text-secondary bg-surface px-2 py-0.5 rounded border border-border">
          <Building2 className="h-3 w-3 text-slate-400" />
          <span>{item.warehouseCode}</span>
        </span>
      ),
    },
    {
      key: 'onHand',
      header: 'On Hand',
      className: 'text-right',
      cell: (item) => <span className="font-mono text-xs font-bold text-text">{item.onHand}</span>,
    },
    {
      key: 'reserved',
      header: 'Reserved',
      className: 'text-right',
      cell: (item) => (
        <span className="font-mono text-xs text-text-secondary">
          {item.reserved > 0 ? <span className="text-amber-500 font-semibold">{item.reserved}</span> : '0'}
        </span>
      ),
    },
    {
      key: 'available',
      header: 'Available',
      className: 'text-right',
      cell: (item) => (
        <span
          className={`font-mono text-xs font-bold ${
            item.available === 0 ? 'text-danger' : item.available <= item.lowStockThreshold ? 'text-amber-500' : 'text-emerald-500'
          }`}
        >
          {item.available}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => getStatusBadge(item.stockStatus),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32 text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setAdjustingItem(item)}
          >
            <SlidersHorizontal className="h-3 w-3 mr-1" />
            <span>Adjust</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="View Stock Audit Ledger"
            onClick={() => setLedgerItem(item)}
          >
            <History className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
            <Boxes className="h-5 w-5 text-indigo-500" />
            <span>Stock & Inventory Records</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Real-time physical on-hand inventory, reserved order allocations, and stock audit ledgers.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Stock On-Hand" value={stats.totalOnHand} icon={<Boxes className="h-5 w-5" />} />
          <StatCard
            label="Total Reserved"
            value={stats.totalReserved}
            icon={<RefreshCw className="h-5 w-5" />}
            tone="sky"
          />
          <StatCard
            label="Low Stock Items"
            value={stats.lowStockCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            label="Out of Stock Items"
            value={stats.outOfStockCount}
            icon={<XCircle className="h-5 w-5" />}
            tone="rose"
          />
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-1 items-center gap-3">
          <SearchInput
            value={search}
            onValueChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by product name or SKU..."
            containerClassName="w-full max-w-sm"
          />

          <Select
            value={warehouseId}
            onChange={(e) => {
              setWarehouseId(e.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            className="w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock ⚠️</option>
            <option value="OUT_OF_STOCK">Out of Stock 🚨</option>
          </Select>
        </div>

        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">
          <option value="variantSku:asc">Sort: SKU (A-Z)</option>
          <option value="onHand:asc">Sort: Stock (Lowest)</option>
          <option value="onHand:desc">Sort: Stock (Highest)</option>
        </Select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        rows={items}
        rowKey={(item) => item._id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Boxes className="size-8" />}
            title="No inventory records found"
            description={
              search || warehouseId || stockStatus !== 'ALL'
                ? 'No items matched your search filters. Try adjusting filter criteria.'
                : 'Stock records will automatically populate as products and variants are created.'
            }
          />
        }
      />

      {/* Pagination */}
      {meta && <Pagination meta={meta} onPageChange={(p) => setPage(p)} />}

      {/* Adjustment Modal */}
      <StockAdjustmentModal
        open={!!adjustingItem}
        onClose={() => setAdjustingItem(null)}
        item={adjustingItem}
        warehouses={warehouses}
        onSaved={loadData}
      />

      {/* Audit Ledger Drawer */}
      <StockLedgerDrawer
        open={!!ledgerItem}
        onClose={() => setLedgerItem(null)}
        item={ledgerItem}
      />
    </div>
  );
}
