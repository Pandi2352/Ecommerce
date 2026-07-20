import { useCallback, useEffect, useState } from 'react';
import { History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge, Drawer, Skeleton } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { fetchStockLedger } from '../api';
import type { InventoryItem, StockAdjustmentItem } from '../types';

interface StockLedgerDrawerProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

export function StockLedgerDrawer({ open, onClose, item }: StockLedgerDrawerProps) {
  const [logs, setLogs] = useState<StockAdjustmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLedger = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    try {
      const res = await fetchStockLedger(item.variantSku);
      setLogs(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load stock ledger'));
    } finally {
      setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    if (open && item) {
      loadLedger();
    }
  }, [open, item, loadLedger]);

  const getTypeTone = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'RETURN':
        return 'success';
      case 'DAMAGE':
      case 'SALE':
        return 'danger';
      case 'TRANSFER':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-500" />
          <span>Audit Ledger — {item?.variantSku}</span>
        </div>
      }
      widthClassName="w-full max-w-lg"
    >
      <div className="space-y-4">
        {item && (
          <div className="rounded-lg border border-border bg-bg/50 p-3 text-xs flex justify-between items-center">
            <div>
              <p className="font-bold text-text">{item.productName}</p>
              <p className="text-text-secondary">Warehouse: {item.warehouseName}</p>
            </div>
            <div className="text-right">
              <span className="text-text-secondary block">Current Stock</span>
              <span className="font-mono text-sm font-bold text-indigo-500">{item.onHand} units</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-secondary">
            No transaction ledger entries recorded yet for this SKU.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isPositive = log.quantityDelta > 0;
              return (
                <div
                  key={log._id}
                  className="flex items-start justify-between rounded-lg border border-border bg-surface p-3 transition-colors hover:border-slate-350 dark:hover:border-slate-700"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={getTypeTone(log.type)}>{log.type}</Badge>
                      <span className="text-[11px] text-text-secondary font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-xs text-text font-medium leading-tight">{log.reason}</p>
                    )}
                    {log.adjustedBy && (
                      <p className="text-[11px] text-text-secondary">By: {log.adjustedBy}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-mono font-bold text-xs">
                    {isPositive ? (
                      <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight className="h-4 w-4" />+{log.quantityDelta}
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-600 dark:text-rose-400">
                        <ArrowDownRight className="h-4 w-4" />{log.quantityDelta}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
