import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Panel width (Tailwind width class). */
  widthClassName?: string;
}

/** Right-side slide-over panel (bordered, no shadow). Closes on Esc / backdrop click. */
export function Drawer({ open, onClose, title, children, footer, widthClassName = 'w-full max-w-md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose} role="presentation">
      <div
        className={cn(
          'flex h-full flex-col border-l border-border bg-surface',
          'motion-safe:animate-[slideIn_.18s_ease-out]',
          widthClassName,
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text">{title}</h2>
            <button onClick={onClose} className="cursor-pointer text-text-secondary hover:text-text" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-4 py-3">{footer}</div>}
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(1rem);opacity:.6}to{transform:translateX(0);opacity:1}}`}</style>
    </div>,
    document.body,
  );
}
