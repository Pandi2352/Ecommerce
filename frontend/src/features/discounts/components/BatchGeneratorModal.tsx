import { useState } from 'react';
import { DiscountType } from '@ecommerce/shared';
import { Button, FormField, Input, Modal, Select } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { batchGenerateDiscounts } from '../api';

interface BatchGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

export function BatchGeneratorModal({ open, onClose, onGenerated }: BatchGeneratorModalProps) {
  const [count, setCount] = useState<number>(10);
  const [prefix, setPrefix] = useState<string>('VIP');
  const [type, setType] = useState<DiscountType>(DiscountType.PERCENTAGE);
  const [value, setValue] = useState<number>(15);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!count || count < 1 || count > 500) {
      toast.error('Count must be between 1 and 500');
      return;
    }

    setSubmitting(true);
    try {
      const res = await batchGenerateDiscounts({
        count: Number(count),
        prefix: prefix.trim().toUpperCase() || 'PROMO',
        type,
        value: Number(value),
        minPurchaseAmount: Number(minPurchaseAmount),
        usageLimitPerUser: 1,
      });
      toast.success(`Generated ${res.generatedCount} unique single-use promo codes! 🎉`);
      onGenerated();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to generate batch codes'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Batch Promo Code Generator"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Generating…' : `Generate ${count} Codes`}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-text-secondary">
          Batch-generate unique single-use randomized promo codes for marketing campaigns (e.g.{' '}
          <span className="font-mono text-indigo-500 font-bold">VIP-9X82A</span>).
        </p>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Number of Codes" required hint="Max 500 codes per batch">
            <Input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </FormField>

          <FormField label="Code Prefix" hint="e.g. VIP or EMAIL">
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="VIP"
              className="font-mono uppercase font-bold"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Discount Type" required>
            <Select value={type} onChange={(e) => setType(e.target.value as DiscountType)}>
              <option value={DiscountType.PERCENTAGE}>Percentage Off (%)</option>
              <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount Off ($)</option>
              <option value={DiscountType.FREE_SHIPPING}>Free Shipping (🚚)</option>
            </Select>
          </FormField>

          {type !== DiscountType.FREE_SHIPPING && (
            <FormField label={type === DiscountType.PERCENTAGE ? 'Value (%)' : 'Value ($)'} required>
              <Input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </FormField>
          )}
        </div>

        <FormField label="Min Order Subtotal ($)" hint="0 for no minimum">
          <Input
            type="number"
            min={0}
            value={minPurchaseAmount}
            onChange={(e) => setMinPurchaseAmount(Number(e.target.value))}
          />
        </FormField>
      </form>
    </Modal>
  );
}
