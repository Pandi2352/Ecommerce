import { useState } from 'react';
import { StockAdjustmentType } from '@ecommerce/shared';
import { Button, FormField, Input, Modal, Select, Textarea } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { adjustStock, transferStock } from '../api';
import type { InventoryItem, WarehouseItem } from '../types';

interface StockAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  warehouses: WarehouseItem[];
  onSaved: () => void;
}

export function StockAdjustmentModal({
  open,
  onClose,
  item,
  warehouses,
  onSaved,
}: StockAdjustmentModalProps) {
  const [type, setType] = useState<StockAdjustmentType>(StockAdjustmentType.PURCHASE);
  const [quantityDelta, setQuantityDelta] = useState<number>(10);
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const isTransfer = type === StockAdjustmentType.TRANSFER;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantityDelta || quantityDelta === 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (isTransfer && !targetWarehouseId) {
      toast.error('Please select a target destination warehouse');
      return;
    }

    setSubmitting(true);
    try {
      if (isTransfer) {
        await transferStock({
          sourceWarehouseId: item.warehouseId,
          targetWarehouseId,
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: Math.abs(quantityDelta),
          reason: reason.trim() || 'Inter-warehouse stock transfer',
        });
        toast.success(`Transferred ${Math.abs(quantityDelta)} units of ${item.variantSku}`);
      } else {
        // Adjust stock
        let delta = quantityDelta;
        if (type === StockAdjustmentType.DAMAGE || type === StockAdjustmentType.SALE) {
          delta = -Math.abs(quantityDelta);
        } else if (type === StockAdjustmentType.PURCHASE || type === StockAdjustmentType.RETURN) {
          delta = Math.abs(quantityDelta);
        }

        await adjustStock({
          type,
          warehouseId: item.warehouseId,
          productId: item.productId,
          variantSku: item.variantSku,
          quantityDelta: delta,
          reason: reason.trim() || `${type} adjustment`,
        });
        toast.success(`Stock adjusted for ${item.variantSku}`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update stock'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Adjust Stock — ${item.variantSku}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Applying…' : 'Apply Adjustment'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Summary Card */}
        <div className="rounded-lg border border-border bg-bg/50 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-text-secondary">Product:</span>
            <span className="font-bold text-text">{item.productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">SKU:</span>
            <span className="font-mono text-indigo-500 font-semibold">{item.variantSku}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Location:</span>
            <span className="font-medium text-text">{item.warehouseName} ({item.warehouseCode})</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border/50">
            <span className="text-text-secondary">Current On Hand:</span>
            <span className="font-bold text-emerald-500">{item.onHand} units</span>
          </div>
        </div>

        {/* Action Type */}
        <FormField label="Adjustment Action Type" required>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as StockAdjustmentType)}
          >
            <option value={StockAdjustmentType.PURCHASE}>Restock / Purchase Arrival (+)</option>
            <option value={StockAdjustmentType.DAMAGE}>Damage / Spoilage Write-off (-)</option>
            <option value={StockAdjustmentType.ADJUSTMENT}>Manual Count Correction (+ / -)</option>
            <option value={StockAdjustmentType.TRANSFER}>Inter-Warehouse Transfer (➔)</option>
            <option value={StockAdjustmentType.RETURN}>Customer Return Restock (+)</option>
          </Select>
        </FormField>

        {/* Quantity */}
        <FormField
          label={isTransfer ? 'Quantity to Transfer' : 'Quantity Count'}
          required
          hint={
            type === StockAdjustmentType.DAMAGE
              ? 'Units will be deducted from stock'
              : type === StockAdjustmentType.PURCHASE
              ? 'Units will be added to stock'
              : 'Enter quantity'
          }
        >
          <Input
            type="number"
            min={1}
            value={quantityDelta}
            onChange={(e) => setQuantityDelta(Number(e.target.value))}
          />
        </FormField>

        {/* Target Warehouse (for Transfer) */}
        {isTransfer && (
          <FormField label="Destination Warehouse" required>
            <Select
              value={targetWarehouseId}
              onChange={(e) => setTargetWarehouseId(e.target.value)}
            >
              <option value="">Select Destination Warehouse…</option>
              {warehouses
                .filter((w) => w._id !== item.warehouseId)
                .map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code})
                  </option>
                ))}
            </Select>
          </FormField>
        )}

        {/* Reason / Reference Note */}
        <FormField label="Reason / Reference Notes">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Shipment PO-98012 arrived, or Damaged in transport..."
            rows={2}
          />
        </FormField>
      </form>
    </Modal>
  );
}
