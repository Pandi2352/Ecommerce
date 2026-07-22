import { Check, Pencil, Star, Trash2 } from 'lucide-react';
import type { Address } from '../account.api';

interface Props {
  address: Address;
  /** Selection mode (checkout) — shows a radio + highlights when selected. */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  /** Management actions (account) */
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

export function AddressCard({
  address: a,
  selectable,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: Props) {
  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={[
        'rounded-md border bg-surface p-4 transition-colors',
        selectable ? 'cursor-pointer' : '',
        selected ? 'border-danger ring-1 ring-danger/30' : 'border-border hover:border-danger/40',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {selectable && (
            <span
              className={[
                'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border',
                selected ? 'border-danger bg-danger text-white' : 'border-border',
              ].join(' ')}
            >
              {selected && <Check className="h-2.5 w-2.5" />}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text truncate">{a.fullName}</span>
              {a.label && (
                <span className="rounded bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                  {a.label}
                </span>
              )}
              {a.isDefault && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  Default
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ''}, {a.city}
              {a.state ? `, ${a.state}` : ''} {a.postalCode}
              {a.country ? `, ${a.country}` : ''}
            </p>
            {a.phone && <p className="text-[11px] text-text-secondary">📞 {a.phone}</p>}
          </div>
        </div>
      </div>

      {(onEdit || onDelete || onSetDefault) && (
        <div className="mt-3 flex items-center gap-3 border-t border-border pt-2.5 text-[11px] font-semibold">
          {onSetDefault && !a.isDefault && (
            <button
              onClick={onSetDefault}
              className="inline-flex items-center gap-1 text-text-secondary hover:text-danger"
            >
              <Star className="h-3 w-3" /> Set default
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 text-text-secondary hover:text-danger"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 text-text-secondary hover:text-danger"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
