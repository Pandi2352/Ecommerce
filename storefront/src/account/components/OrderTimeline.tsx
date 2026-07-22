import { Check, CircleDot, PackageCheck, Truck, XCircle } from 'lucide-react';

export interface TimelineEntry {
  status: string;
  note?: string;
  at: string;
}

const FLOW = ['CREATED', 'PACKED', 'SHIPPED', 'DELIVERED'] as const;
const FLOW_LABEL: Record<string, string> = {
  CREATED: 'Placed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
};
const TERMINAL = ['CANCELLED', 'RETURNED', 'REFUNDED'];

/** Order fulfilment progress + full event history. rounded-md, no shadows. */
export function OrderTimeline({ status, timeline }: { status: string; timeline: TimelineEntry[] }) {
  const isTerminal = TERMINAL.includes(status);
  const currentIdx = FLOW.indexOf(status as (typeof FLOW)[number]);

  return (
    <div className="space-y-4">
      {isTerminal ? (
        <div className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
          <XCircle className="h-4 w-4" />
          Order {status.toLowerCase()}
        </div>
      ) : (
        <div className="flex items-center">
          {FLOW.map((s, i) => {
            const done = currentIdx >= i;
            const Icon =
              s === 'DELIVERED' ? PackageCheck : s === 'SHIPPED' ? Truck : done ? Check : CircleDot;
            return (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={[
                      'grid h-8 w-8 place-items-center rounded-full border',
                      done
                        ? 'border-danger bg-danger text-white'
                        : 'border-border bg-surface text-text-secondary',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${done ? 'text-text' : 'text-text-secondary'}`}
                  >
                    {FLOW_LABEL[s]}
                  </span>
                </div>
                {i < FLOW.length - 1 && (
                  <span
                    className={`mx-1 h-0.5 flex-1 ${currentIdx > i ? 'bg-danger' : 'bg-border'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Event history */}
      <ol className="space-y-2 border-t border-border pt-3">
        {[...timeline].reverse().map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
            <div>
              <span className="font-semibold text-text">{t.status}</span>
              {t.note && <span className="text-text-secondary"> — {t.note}</span>}
              <span className="ml-1 text-text-secondary">
                ·{' '}
                {new Date(t.at).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
