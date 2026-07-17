import { useNavigate } from 'react-router-dom';
import { Badge, Button } from '@/components/ui';

const kpis = [
  { label: 'Revenue', value: '₹2.4M', delta: '+18%' },
  { label: 'Orders', value: '1,284', delta: '+6%' },
  { label: 'Customers', value: '842', delta: '+12%' },
  { label: 'Conversion', value: '3.2%', delta: '-0.4%' },
];

export function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Dashboard</h1>
          <p className="text-sm text-text-secondary">Sprint 1 shell — widgets arrive in Sprint 3.</p>
        </div>
        <Button onClick={() => navigate('/kitchen-sink')}>View components</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-md border bg-surface p-4">
            <p className="text-sm text-text-secondary">{k.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-text">{k.value}</span>
              <Badge tone={k.delta.startsWith('-') ? 'danger' : 'success'}>{k.delta}</Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border bg-surface p-4">
        <p className="text-sm text-text-secondary">
          Charts, tables, and activity feeds are placeholders until Sprint 3.
        </p>
      </div>
    </div>
  );
}
