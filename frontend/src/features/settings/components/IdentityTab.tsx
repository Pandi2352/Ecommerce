import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button, Card, FormField, Input } from '@/components/ui';
import { uploadImage } from '@/lib/api';
import { toast } from '@/components/ui';
import type { SocialLinks, StorefrontSettingsInput } from '../storefront-settings.api';

interface Props {
  form: StorefrontSettingsInput;
  onChange: (key: keyof StorefrontSettingsInput, val: unknown) => void;
  disabled?: boolean;
}

export function IdentityTab({ form, onChange, disabled }: Props) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingProductImg, setUploadingProductImg] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const productImgRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (logoRef.current) logoRef.current.value = '';
    if (!file) return;

    setUploadingLogo(true);
    try {
      const url = await uploadImage(file);
      onChange('logoUrl', url);
      toast.success('Storefront logo uploaded!');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (faviconRef.current) faviconRef.current.value = '';
    if (!file) return;

    setUploadingFavicon(true);
    try {
      const url = await uploadImage(file);
      onChange('faviconUrl', url);
      toast.success('Favicon uploaded!');
    } catch {
      toast.error('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleProductImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (productImgRef.current) productImgRef.current.value = '';
    if (!file) return;

    setUploadingProductImg(true);
    try {
      const url = await uploadImage(file);
      onChange('defaultProductImageUrl', url);
      toast.success('Default product image uploaded!');
    } catch {
      toast.error('Failed to upload default product image');
    } finally {
      setUploadingProductImg(false);
    }
  };

  const setSocial = (network: keyof SocialLinks, val: string) => {
    onChange('socialLinks', {
      ...form.socialLinks,
      [network]: val,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text">Store Identity & Branding</h3>
        <p className="mt-0.5 text-xs text-text-secondary">
          Storefront logo, default product image, tagline, footer details, and social channels.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Store Display Name" required>
            <Input
              value={form.storeName ?? ''}
              onChange={(e) => onChange('storeName', e.target.value)}
              disabled={disabled}
              placeholder="e.g. MaxShop or NovaShop"
            />
          </FormField>

          <FormField label="Tagline / Motto">
            <Input
              value={form.tagline ?? ''}
              onChange={(e) => onChange('tagline', e.target.value)}
              disabled={disabled}
              placeholder="e.g. Your One-Stop Storefront Destination"
            />
          </FormField>

          {/* Logo Upload */}
          <FormField label="Storefront Header Logo">
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="logo"
                  className="h-10 max-w-32 object-contain rounded border border-border bg-bg p-1"
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded border border-border bg-bg text-text-secondary">
                  <ImagePlus className="size-4" />
                </span>
              )}
              {!disabled && (
                <>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={uploadingLogo}
                    onClick={() => logoRef.current?.click()}
                  >
                    Upload Logo
                  </Button>
                </>
              )}
            </div>
          </FormField>

          {/* Favicon Upload */}
          <FormField label="Browser Favicon Icon">
            <div className="flex items-center gap-3">
              {form.faviconUrl ? (
                <img
                  src={form.faviconUrl}
                  alt="favicon"
                  className="size-8 object-contain rounded border border-border bg-bg p-1"
                />
              ) : (
                <span className="grid size-8 place-items-center rounded border border-border bg-bg text-text-secondary">
                  <ImagePlus className="size-4" />
                </span>
              )}
              {!disabled && (
                <>
                  <input
                    ref={faviconRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFaviconUpload}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={uploadingFavicon}
                    onClick={() => faviconRef.current?.click()}
                  >
                    Upload Favicon
                  </Button>
                </>
              )}
            </div>
          </FormField>

          {/* Default Product Image Upload */}
          <FormField label="Default Product Fallback Image" className="sm:col-span-2">
            <p className="text-[11px] text-text-muted mb-2">
              Displayed on product cards whenever a product is added without an image.
            </p>
            <div className="flex items-center gap-3">
              {form.defaultProductImageUrl ? (
                <img
                  src={form.defaultProductImageUrl}
                  alt="default product"
                  className="h-14 w-14 object-cover rounded border border-border bg-bg"
                />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded border border-border bg-bg text-text-secondary">
                  <ImagePlus className="size-5" />
                </span>
              )}
              {!disabled && (
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={productImgRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProductImgUpload}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={uploadingProductImg}
                      onClick={() => productImgRef.current?.click()}
                    >
                      Upload Default Product Image
                    </Button>
                    {form.defaultProductImageUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange('defaultProductImageUrl', '')}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormField>

          <FormField label="Footer Copyright Text" className="sm:col-span-2">
            <Input
              value={form.footerText ?? ''}
              onChange={(e) => onChange('footerText', e.target.value)}
              disabled={disabled}
              placeholder="© 2026 Storefront. All rights reserved."
            />
          </FormField>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <h4 className="text-xs font-semibold text-text">Social Media Links</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FormField label="Facebook URL">
              <Input
                value={form.socialLinks?.facebook ?? ''}
                onChange={(e) => setSocial('facebook', e.target.value)}
                disabled={disabled}
                placeholder="https://facebook.com/yourstore"
              />
            </FormField>
            <FormField label="Instagram URL">
              <Input
                value={form.socialLinks?.instagram ?? ''}
                onChange={(e) => setSocial('instagram', e.target.value)}
                disabled={disabled}
                placeholder="https://instagram.com/yourstore"
              />
            </FormField>
            <FormField label="Twitter / X URL">
              <Input
                value={form.socialLinks?.twitter ?? ''}
                onChange={(e) => setSocial('twitter', e.target.value)}
                disabled={disabled}
                placeholder="https://x.com/yourstore"
              />
            </FormField>
            <FormField label="YouTube URL">
              <Input
                value={form.socialLinks?.youtube ?? ''}
                onChange={(e) => setSocial('youtube', e.target.value)}
                disabled={disabled}
                placeholder="https://youtube.com/c/yourstore"
              />
            </FormField>
          </div>
        </div>
      </Card>
    </div>
  );
}
