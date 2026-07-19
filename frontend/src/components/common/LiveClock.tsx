import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

const IST = 'Asia/Kolkata';
// Time: 12-hour with seconds + AM/PM, in Indian Standard Time.
const timeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: IST,
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});
// Date: "Sat, 19 Jul 2026".
const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/** Compact live clock — IST, 12-hour with seconds + AM/PM, and the current date. */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        'hidden items-center gap-1.5 rounded-md border border-border bg-bg px-2 py-1 lg:flex',
        className,
      )}
      title="Indian Standard Time"
    >
      <Clock className="size-3.5 shrink-0 text-indigo-500" />
      <div className="leading-none">
        <div className="font-mono text-xs font-semibold tabular-nums text-text">{timeFmt.format(now)}</div>
        <div className="mt-0.5 text-[9px] font-medium text-text-secondary">{dateFmt.format(now)}</div>
      </div>
    </div>
  );
}
