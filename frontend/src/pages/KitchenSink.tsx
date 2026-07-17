import { useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  Tooltip,
  toast,
  type Column,
} from '@/components/ui';

interface Row {
  id: string;
  product: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  price: string;
}

const rows: Row[] = [
  { id: '1', product: 'Floral Maxi Dress', status: 'ACTIVE', price: '₹2,499' },
  { id: '2', product: 'Denim Jacket', status: 'DRAFT', price: '₹3,299' },
  { id: '3', product: 'Silk Saree', status: 'ARCHIVED', price: '₹6,999' },
];

const statusTone = { ACTIVE: 'success', DRAFT: 'neutral', ARCHIVED: 'danger' } as const;

const columns: Column<Row>[] = [
  { key: 'product', header: 'Product', cell: (r) => <span className="font-medium">{r.product}</span> },
  { key: 'status', header: 'Status', cell: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
  { key: 'price', header: 'Price', cell: (r) => <span className="tabular-nums">{r.price}</span> },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

export function KitchenSink() {
  const [modal, setModal] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Component Gallery</h1>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-md gap-3">
          <Input placeholder="Text input" />
          <Input placeholder="Error input" error />
          <Select defaultValue="">
            <option value="" disabled>
              Choose a category…
            </option>
            <option>Dresses</option>
            <option>Footwear</option>
            <option>Accessories</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-text">
            <Checkbox defaultChecked /> Subscribe to updates
          </label>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Draft</Badge>
          <Badge tone="success">Active</Badge>
          <Badge tone="warning">Pending</Badge>
          <Badge tone="danger">Cancelled</Badge>
          <Badge tone="info">New</Badge>
        </div>
      </Section>

      <Section title="Table">
        <Table columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => toast.info(r.product)} />
      </Section>

      <Section title="Overlays & feedback">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setModal(true)}>
            Open modal
          </Button>
          <Button variant="secondary" onClick={() => toast.success('Saved!')}>
            Toast
          </Button>
          <Tooltip label="Helpful hint">
            <Button variant="ghost">Hover me</Button>
          </Tooltip>
          <Dropdown
            trigger={<Button variant="secondary">Menu ▾</Button>}
            items={[
              { label: 'Edit', onSelect: () => toast.info('Edit') },
              { label: 'Duplicate', onSelect: () => toast.info('Duplicate') },
              { label: 'Delete', onSelect: () => toast.error('Deleted'), danger: true },
            ]}
          />
        </div>
      </Section>

      <Section title="Loading & empty states">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <EmptyState
            title="No products"
            description="Start by creating one."
            action={<Button size="sm">Create product</Button>}
          />
        </div>
      </Section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Example dialog"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModal(false)}>Confirm</Button>
          </>
        }
      >
        Bordered dialog with a dimmed backdrop — no shadow, rounded-md.
      </Modal>
    </div>
  );
}
