import { useEffect, useState } from 'react';
import { VendorStatus } from '@ecommerce/shared';
import { Button, Drawer, FormField, Input, Select, Textarea } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { createVendor, updateVendor } from '../api';
import type { VendorItem } from '../types';

interface VendorEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  vendor: VendorItem | null; // null = create mode
  onSaved: () => void;
}

export function VendorEditorDrawer({ open, onClose, vendor, onSaved }: VendorEditorDrawerProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [commissionRate, setCommissionRate] = useState<number | string>(0);
  const [status, setStatus] = useState<VendorStatus>(VendorStatus.ACTIVE);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (vendor && open) {
      setName(vendor.name || '');
      setCode(vendor.code || '');
      setContactName(vendor.contactName || '');
      setEmail(vendor.email || '');
      setPhone(vendor.phone || '');
      setAddress(vendor.address || '');
      setWebsite(vendor.website || '');
      setCommissionRate(vendor.commissionRate ?? 0);
      setStatus(vendor.status || VendorStatus.ACTIVE);
      setNotes(vendor.notes || '');
    } else if (!open) {
      setName('');
      setCode('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setWebsite('');
      setCommissionRate(0);
      setStatus(VendorStatus.ACTIVE);
      setNotes('');
    }
  }, [vendor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    if (!code.trim()) {
      toast.error('Vendor code is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        website: website.trim(),
        commissionRate:
          commissionRate === '' ? 0 : Math.max(0, Math.min(100, Number(commissionRate))),
        status,
        notes: notes.trim(),
      };

      if (vendor) {
        await updateVendor(vendor.id, payload);
        toast.success(`Vendor "${name}" updated`);
      } else {
        await createVendor(payload);
        toast.success(`Vendor "${name}" created`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save vendor'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={vendor ? `Edit Vendor: ${vendor.name}` : 'Create New Vendor'}
      widthClassName="w-full max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : vendor ? 'Update Vendor' : 'Create Vendor'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Vendor / Company Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Supplies Ltd"
              autoFocus
            />
          </FormField>

          <FormField label="Vendor Code" required hint="Unique identifier">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. VND-1001"
              className="font-mono uppercase"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Primary Contact Person">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
            />
          </FormField>

          <FormField label="Contact Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sales@acmesupplies.com"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone Number">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
            />
          </FormField>

          <FormField label="Commission Rate (%)">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="0"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Website URL">
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://acmesupplies.com"
            />
          </FormField>

          <FormField label="Account Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as VendorStatus)}>
              <option value={VendorStatus.ACTIVE}>Active</option>
              <option value={VendorStatus.INACTIVE}>Inactive</option>
              <option value={VendorStatus.PENDING_APPROVAL}>Pending Approval</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Physical / Billing Address">
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Industrial Parkway, Suite 400..."
            rows={2}
          />
        </FormField>

        <FormField label="Internal Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special terms, delivery schedules, account notes..."
            rows={3}
          />
        </FormField>
      </form>
    </Drawer>
  );
}
