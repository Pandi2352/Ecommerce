import { useEffect, useState } from 'react';
import { Button, Checkbox, Drawer, FormField, Input, Textarea } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { createWarehouse, updateWarehouse } from '../api';
import type { WarehouseItem } from '../types';

interface WarehouseEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  warehouse: WarehouseItem | null; // null = create mode
  onSaved: () => void;
}

export function WarehouseEditorDrawer({
  open,
  onClose,
  warehouse,
  onSaved,
}: WarehouseEditorDrawerProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name);
      setCode(warehouse.code);
      setContactName(warehouse.contactName || '');
      setEmail(warehouse.email || '');
      setPhone(warehouse.phone || '');
      setAddress(warehouse.address || '');
      setIsPrimary(warehouse.isPrimary);
      setIsActive(warehouse.isActive);
    } else {
      setName('');
      setCode('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setIsPrimary(false);
      setIsActive(true);
    }
  }, [warehouse, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Warehouse name is required');
      return;
    }
    if (!code.trim()) {
      toast.error('Warehouse code is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactName: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        isPrimary,
        isActive,
      };

      if (warehouse) {
        await updateWarehouse(warehouse._id, payload);
        toast.success(`Warehouse "${name}" updated`);
      } else {
        await createWarehouse(payload);
        toast.success(`Warehouse "${name}" created`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save warehouse'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={warehouse ? `Edit Warehouse: ${warehouse.name}` : 'Add New Warehouse'}
      widthClassName="w-full max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : warehouse ? 'Update Warehouse' : 'Create Warehouse'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Warehouse Name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. West Coast Distribution Center"
            autoFocus
          />
        </FormField>

        <FormField label="Warehouse Code" required hint="Unique identifier (e.g. WH-WEST)">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WH-WEST"
            className="font-mono uppercase"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Contact Person">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Michael Scott"
            />
          </FormField>

          <FormField label="Contact Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="wh-west@nova.shop"
            />
          </FormField>
        </div>

        <FormField label="Phone Number">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 019-8833"
          />
        </FormField>

        <FormField label="Address">
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="400 Logistics Way, Dock #4..."
            rows={2}
          />
        </FormField>

        <div className="flex flex-col gap-2 rounded-lg border border-border p-3 bg-bg/50">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text">
            <Checkbox checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
            <span>Mark as Primary Fulfilment Center</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text">
            <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Active Location</span>
          </label>
        </div>
      </form>
    </Drawer>
  );
}
