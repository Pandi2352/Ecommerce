import { useRef, useState } from 'react';
import { Plus, Trash2, ImagePlus, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { Button, Card, FormField, Input } from '@/components/ui';
import { uploadImage } from '@/lib/api';
import { toast } from '@/components/ui';
import type { BannerSlide } from '../storefront-settings.api';

interface Props {
  banners: BannerSlide[];
  onChange: (banners: BannerSlide[]) => void;
  disabled?: boolean;
}

export function BannersTab({ banners, onChange, disabled }: Props) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  const addBanner = () => {
    const newSlide: BannerSlide = {
      id: `banner-${Date.now()}`,
      imageUrl: '',
      title: 'New Special Offer',
      subtitle: 'Up to 50% off on all selected items this season',
      ctaText: 'Shop Now',
      ctaLink: '/',
      badgeText: 'HOT DEAL',
      isActive: true,
      order: banners.length,
    };
    onChange([...banners, newSlide]);
  };

  const updateSlide = (id: string, field: keyof BannerSlide, value: unknown) => {
    onChange(banners.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const removeSlide = (id: string) => {
    onChange(banners.filter((b) => b.id !== id));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    // reassign order
    onChange(updated.map((b, i) => ({ ...b, order: i })));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || !activeUploadId) return;

    setUploadingId(activeUploadId);
    try {
      const url = await uploadImage(file);
      updateSlide(activeUploadId, 'imageUrl', url);
      toast.success('Banner image uploaded!');
    } catch {
      toast.error('Failed to upload banner image');
    } finally {
      setUploadingId(null);
      setActiveUploadId(null);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">Hero Carousel Banners</h3>
          <p className="text-xs text-text-secondary">
            Manage main storefront carousel slides, images, headings, and CTAs.
          </p>
        </div>
        {!disabled && (
          <Button size="sm" onClick={addBanner}>
            <Plus className="mr-1 size-4" /> Add Banner Slide
          </Button>
        )}
      </div>

      {banners.length === 0 ? (
        <Card className="p-8 text-center text-text-secondary">
          <p className="text-sm">No banners configured yet.</p>
          <p className="mt-1 text-xs">
            Click "Add Banner Slide" above to create your first hero carousel banner.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <Card key={banner.id} className="p-4">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded bg-surface-2 text-xs font-bold text-text-secondary">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-text">
                    {banner.title || 'Untitled Banner'}
                  </span>
                  {!banner.isActive && (
                    <span className="rounded bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
                      Disabled
                    </span>
                  )}
                </div>
                {!disabled && (
                  <div className="flex items-center gap-1">
                    <button
                      disabled={index === 0}
                      onClick={() => moveSlide(index, 'up')}
                      className="rounded p-1 text-text-secondary hover:bg-bg disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      disabled={index === banners.length - 1}
                      onClick={() => moveSlide(index, 'down')}
                      className="rounded p-1 text-text-secondary hover:bg-bg disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      onClick={() => updateSlide(banner.id, 'isActive', !banner.isActive)}
                      className="rounded p-1 text-text-secondary hover:bg-bg"
                      title={banner.isActive ? 'Disable banner' : 'Enable banner'}
                    >
                      {banner.isActive ? (
                        <Eye className="size-4 text-success" />
                      ) : (
                        <EyeOff className="size-4 text-text-secondary" />
                      )}
                    </button>
                    <button
                      onClick={() => removeSlide(banner.id)}
                      className="rounded p-1 text-text-secondary hover:bg-bg hover:text-danger"
                      title="Delete banner"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Banner Image Preview / Upload */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-text">Banner Image</span>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-md border border-border bg-bg">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center p-2 text-center text-xs text-text-secondary">
                        <ImagePlus className="mb-1 size-6 text-text-muted" />
                        No image uploaded
                      </div>
                    )}
                  </div>
                  {!disabled && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      loading={uploadingId === banner.id}
                      onClick={() => {
                        setActiveUploadId(banner.id);
                        fileInputRef.current?.click();
                      }}
                    >
                      Upload Banner Image
                    </Button>
                  )}
                </div>

                {/* Banner Text Fields */}
                <div className="space-y-3 sm:col-span-2">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Badge Text">
                      <Input
                        value={banner.badgeText ?? ''}
                        placeholder="e.g. HOT DEAL, 50% OFF"
                        onChange={(e) => updateSlide(banner.id, 'badgeText', e.target.value)}
                        disabled={disabled}
                      />
                    </FormField>
                    <FormField label="Main Heading">
                      <Input
                        value={banner.title ?? ''}
                        placeholder="Banner Title"
                        onChange={(e) => updateSlide(banner.id, 'title', e.target.value)}
                        disabled={disabled}
                      />
                    </FormField>
                  </div>

                  <FormField label="Subtitle Description">
                    <Input
                      value={banner.subtitle ?? ''}
                      placeholder="Short catchy banner description..."
                      onChange={(e) => updateSlide(banner.id, 'subtitle', e.target.value)}
                      disabled={disabled}
                    />
                  </FormField>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="CTA Button Text">
                      <Input
                        value={banner.ctaText ?? ''}
                        placeholder="e.g. Shop Now"
                        onChange={(e) => updateSlide(banner.id, 'ctaText', e.target.value)}
                        disabled={disabled}
                      />
                    </FormField>
                    <FormField label="CTA Button Target Link">
                      <Input
                        value={banner.ctaLink ?? ''}
                        placeholder="e.g. /products or /collections"
                        onChange={(e) => updateSlide(banner.id, 'ctaLink', e.target.value)}
                        disabled={disabled}
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
