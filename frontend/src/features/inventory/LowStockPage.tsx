import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Building2,
  PackageX,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
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
import { fetchInventoryStats, fetchLowStock, fetchWarehouses } from './api';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import type { InventoryItem, InventoryStats, WarehouseItem } from './types';

export function LowStockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, whRes, statsRes] = await Promise.all([
        fetchLowStock({
          page,
          pageSize: 15,
          search: search.trim() || undefined,
          warehouseId: warehouseFilter !== 'ALL' ? warehouseFilter : undefined,
        }),
        fetchWarehouses({ pageSize: 100 }),
        fetchInventoryStats(),
      ]);
      setItems(res.data);
      setMeta(res.meta);
      setWarehouses(whRes.data);
      setStats(statsRes);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load low stock items'));
    } finally {
      setLoading(false);
    }
  }, [page, search, warehouseFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
            <span className="font-mono text-[11px] font-semibold text-indigo-500">
              {item.variantSku}
            </span>
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
      key: 'available',
      header: 'Available',
      className: 'text-right',
      cell: (item) => (
        <span
          className={`font-mono text-xs font-bold ${item.available === 0 ? 'text-danger' : 'text-amber-500'}`}
        >
          {item.available}
        </span>
      ),
    },
    {
      key: 'threshold',
      header: 'Alert Threshold',
      className: 'text-right',
      cell: (item) => (
        <span className="font-mono text-xs text-text-secondary">≤ {item.lowStockThreshold}</span>
      ),
    },
    {
      key: 'status',
      header: 'Alert Level',
      cell: (item) =>
        item.available === 0 ? (
          <Badge tone="danger">Out of Stock</Badge>
        ) : (
          <Badge tone="warning">Low Stock</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28 text-right',
      cell: (item) => (
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs px-2 gap-1"
          onClick={() => setAdjustingItem(item)}
        >
          <SlidersHorizontal className="h-3 w-3" />
          <span>Restock</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Low Stock &amp; Out of Stock Alerts</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Inventory items currently at or below their low-stock threshold and needing restock.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Low Stock Items"
            value={stats.lowStockCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            label="Out of Stock"
            value={stats.outOfStockCount}
            icon={<PackageX className="h-5 w-5" />}
            tone="rose"
          />
          <StatCard
            label="Total On-Hand"
            value={stats.totalOnHand}
            icon={<Boxes className="h-5 w-5" />}
          />
          <StatCard
            label="Reserved"
            value={stats.totalReserved}
            icon={<Package className="h-5 w-5" />}
            tone="sky"
          />
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-md border border-border bg-surface p-3">
        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Filter low stock by product name or SKU..."
          containerClassName="w-full max-w-md"
        />
        <Select
          value={warehouseFilter}
          onChange={(e) => {
            setWarehouseFilter(e.target.value);
            setPage(1);
          }}
          className="w-52"
        >
          <option value="ALL">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name} ({w.code})
            </option>
          ))}
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
            icon={<AlertTriangle className="size-8 text-emerald-500" />}
            title="All inventory levels are healthy"
            description="No items are currently at or below their low-stock threshold in the selected scope."
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
    </div>
  );
}
