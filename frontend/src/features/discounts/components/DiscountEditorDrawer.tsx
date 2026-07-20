import { useEffect, useState } from 'react';
import { DiscountStatus, DiscountType } from '@ecommerce/shared';
import { Button, Checkbox, Drawer, FormField, Input, Select } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { createDiscount, updateDiscount } from '../api';
import type { CouponItem } from '../types';

interface DiscountEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  coupon: CouponItem | null; // null = create mode
  onSaved: () => void;
}

export function DiscountEditorDrawer({
  open,
  onClose,
  coupon,
  onSaved,
}: DiscountEditorDrawerProps) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<DiscountType>(DiscountType.PERCENTAGE);
  const [value, setValue] = useState<number>(15);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [isAutoApplied, setIsAutoApplied] = useState(false);
  const [isStackable, setIsStackable] = useState(false);
  const [firstTimeUserOnly, setFirstTimeUserOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimitTotal, setUsageLimitTotal] = useState<string>('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number>(1);
  const [status, setStatus] = useState<DiscountStatus>(DiscountStatus.ACTIVE);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setType(coupon.type);
      setValue(coupon.value);
      setMinPurchaseAmount(coupon.minPurchaseAmount);
      setMaxDiscountAmount(coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '');
      setIsAutoApplied(coupon.isAutoApplied);
      setIsStackable(coupon.isStackable);
      setFirstTimeUserOnly(coupon.firstTimeUserOnly);
      setStartDate(coupon.startDate ? coupon.startDate.split('T')[0] : '');
      setEndDate(coupon.endDate ? coupon.endDate.split('T')[0] : '');
      setUsageLimitTotal(coupon.usageLimitTotal ? String(coupon.usageLimitTotal) : '');
      setUsageLimitPerUser(coupon.usageLimitPerUser);
      setStatus(coupon.status);
    } else {
      setCode('');
      setType(DiscountType.PERCENTAGE);
      setValue(15);
      setMinPurchaseAmount(0);
      setMaxDiscountAmount('');
      setIsAutoApplied(false);
      setIsStackable(false);
      setFirstTimeUserOnly(false);
      setStartDate('');
      setEndDate('');
      setUsageLimitTotal('');
      setUsageLimitPerUser(1);
      setStatus(DiscountStatus.ACTIVE);
    }
  }, [coupon, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Promo code is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minPurchaseAmount: Number(minPurchaseAmount),
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        isAutoApplied,
        isStackable,
        firstTimeUserOnly,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        usageLimitTotal: usageLimitTotal ? Number(usageLimitTotal) : undefined,
        usageLimitPerUser: Number(usageLimitPerUser),
        status,
      };

      if (coupon) {
        await updateDiscount(coupon._id, payload);
        toast.success(`Discount code "${code}" updated`);
      } else {
        await createDiscount(payload);
        toast.success(`Discount code "${code}" created 🎉`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save discount code'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={coupon ? `Edit Promo: ${coupon.code}` : 'Create New Promo Code'}
      widthClassName="w-full max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : coupon ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Promo Code" required hint="e.g. SUMMER20 or WELCOME10">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SUMMER20"
            className="font-mono uppercase font-bold text-indigo-500"
            autoFocus
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Discount Type" required>
            <Select value={type} onChange={(e) => setType(e.target.value as DiscountType)}>
              <option value={DiscountType.PERCENTAGE}>Percentage Off (%)</option>
              <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount Off ($)</option>
              <option value={DiscountType.FREE_SHIPPING}>Free Shipping (🚚)</option>
              <option value={DiscountType.BUY_X_GET_Y}>Buy X Get Y (BXGY)</option>
              <option value={DiscountType.TIERED}>Tiered Spend Rule</option>
            </Select>
          </FormField>

          {type !== DiscountType.FREE_SHIPPING && (
            <FormField label={type === DiscountType.PERCENTAGE ? 'Percentage (%)' : 'Discount ($)'} required>
              <Input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </FormField>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Min Order Subtotal ($)" hint="0 for no minimum">
            <Input
              type="number"
              min={0}
              value={minPurchaseAmount}
              onChange={(e) => setMinPurchaseAmount(Number(e.target.value))}
            />
          </FormField>

          {type === DiscountType.PERCENTAGE && (
            <FormField label="Max Discount Cap ($)" hint="Optional max cap">
              <Input
                type="number"
                min={0}
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="Unlimited"
              />
            </FormField>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>

          <FormField label="Expiry Date">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Global Usage Limit" hint="Total redemptions allowed">
            <Input
              type="number"
              min={1}
              value={usageLimitTotal}
              onChange={(e) => setUsageLimitTotal(e.target.value)}
              placeholder="Unlimited"
            />
          </FormField>

          <FormField label="Per-User Limit" hint="Max uses per customer">
            <Input
              type="number"
              min={1}
              value={usageLimitPerUser}
              onChange={(e) => setUsageLimitPerUser(Number(e.target.value))}
            />
          </FormField>
        </div>

        <FormField label="Coupon Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as DiscountStatus)}>
            <option value={DiscountStatus.ACTIVE}>Active</option>
            <option value={DiscountStatus.DISABLED}>Disabled</option>
            <option value={DiscountStatus.EXPIRED}>Expired</option>
          </Select>
        </FormField>

        {/* Rule Switches */}
        <div className="space-y-2.5 rounded-lg border border-border p-3 bg-bg/50 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-text">
            <Checkbox checked={isAutoApplied} onChange={(e) => setIsAutoApplied(e.target.checked)} />
            <span>Auto-apply in cart (no promo code typing required)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-text">
            <Checkbox checked={isStackable} onChange={(e) => setIsStackable(e.target.checked)} />
            <span>Stackable (can combine with other discount codes)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-text">
            <Checkbox checked={firstTimeUserOnly} onChange={(e) => setFirstTimeUserOnly(e.target.checked)} />
            <span>First-time buyers only (restricted to 1st order)</span>
          </label>
        </div>
      </form>
    </Drawer>
  );
}
