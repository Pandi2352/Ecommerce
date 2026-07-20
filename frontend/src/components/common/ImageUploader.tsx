import { useRef, useState } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import { uploadImage } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { cn } from '@/utils/cn';

export interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  className?: string;
}

/**
 * Multi-image gallery uploader. Uploads via /uploads/image (driver-aware) and
 * manages an ordered `string[]` — the first image is the primary/thumbnail.
 */
export function ImageUploader({ value, onChange, max = 8, className }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const full = value.length >= max;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (!files.length) return;
    const room = max - value.length;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, room)) urls.push(await uploadImage(file));
      onChange([...value, ...urls]);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Upload failed'));
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const makePrimary = (i: number) => {
    if (i === 0) return;
    const next = [...value];
    const [img] = next.splice(i, 1);
    onChange([img, ...next]);
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {value.map((url, i) => (
        <div key={url} className="group relative size-20 overflow-hidden rounded-md border border-border">
          <img src={url} alt="" className="size-full object-cover" />
          {i === 0 && (
            <span className="absolute left-1 top-1 rounded bg-indigo-600 px-1 py-0.5 text-[9px] font-semibold text-white">
              Primary
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {i !== 0 && (
              <button type="button" onClick={() => makePrimary(i)} aria-label="Make primary" className="grid size-6 place-items-center rounded bg-surface text-text-secondary hover:text-text">
                <Star className="size-3.5" />
              </button>
            )}
            <button type="button" onClick={() => removeAt(i)} aria-label="Remove" className="grid size-6 place-items-center rounded bg-surface text-danger">
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
      {!full && (
        <>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="grid size-20 cursor-pointer place-items-center rounded-md border border-dashed border-border text-text-secondary hover:border-indigo-500 hover:text-text disabled:opacity-50"
          >
            <span className="flex flex-col items-center gap-1 text-[10px]">
              <ImagePlus className="size-5" />
              {busy ? 'Uploading…' : 'Add'}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
