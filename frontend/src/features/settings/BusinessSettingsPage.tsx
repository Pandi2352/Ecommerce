import { useEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  PasswordInput,
  Select,
  Skeleton,
  toast,
} from '@/components/ui';
import { PageHeader } from '@/components/common';
import { uploadImage } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useMutation } from '@/hooks/useMutation';
import { useAuth } from '@/features/auth/AuthContext';
import {
  fetchSettings,
  updateSettings,
  type BusinessSettings,
  type BusinessSettingsInput,
} from './business.api';

const empty: BusinessSettingsInput = { address: {}, uploadDriver: 'local' };

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function BusinessSettingsPage() {
  const { can } = useAuth();
  const canWrite = can('settings.write');
  const { data, loading, error, reload } = useApi<BusinessSettings>(fetchSettings, {
    errorMessage: 'Failed to load settings',
  });
  const [form, setForm] = useState<BusinessSettingsInput>(empty);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const save = useMutation();

  useEffect(() => {
    if (data) setForm({ ...data, address: data.address ?? {} });
  }, [data]);

  const set = (key: keyof BusinessSettingsInput, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setAddr = (key: string, value: string) =>
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));

  const onSave = () =>
    void save.run(() => updateSettings(form), {
      success: 'Business settings saved',
      error: 'Save failed',
      onSuccess: () => void reload(),
    });

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (logoRef.current) logoRef.current.value = '';
    if (!file) return;
    setUploading(true);
    try {
      set('logoUrl', await uploadImage(file));
      toast.success('Logo uploaded — remember to save');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Business Settings"
        subtitle="Store identity, contact, localization and file storage."
        action={canWrite && <Button onClick={onSave} loading={save.saving}>Save changes</Button>}
      />

      {!canWrite && <Alert tone="info">You can view these settings but need the Settings-write permission to change them.</Alert>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Store identity">
          <FormField label="Store name" required className="sm:col-span-2">
            <Input value={form.storeName ?? ''} onChange={(e) => set('storeName', e.target.value)} disabled={!canWrite} />
          </FormField>
          <FormField label="Legal name">
            <Input value={form.legalName ?? ''} onChange={(e) => set('legalName', e.target.value)} disabled={!canWrite} />
          </FormField>
          <FormField label="Tagline">
            <Input value={form.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} disabled={!canWrite} />
          </FormField>
          <FormField label="Logo" className="sm:col-span-2">
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="logo" className="size-12 rounded-md border border-border object-contain" />
              ) : (
                <span className="grid size-12 place-items-center rounded-md border border-border bg-bg text-text-secondary">
                  <ImagePlus className="size-5" />
                </span>
              )}
              {canWrite && (
                <>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
                  <Button variant="secondary" size="sm" loading={uploading} onClick={() => logoRef.current?.click()}>
                    Upload logo
                  </Button>
                </>
              )}
            </div>
          </FormField>
        </Section>

        <Section title="Contact">
          <FormField label="Support email">
            <Input value={form.supportEmail ?? ''} onChange={(e) => set('supportEmail', e.target.value)} disabled={!canWrite} />
          </FormField>
          <FormField label="Support phone">
            <Input value={form.supportPhone ?? ''} onChange={(e) => set('supportPhone', e.target.value)} disabled={!canWrite} />
          </FormField>
        </Section>

        <Section title="Address">
          <FormField label="Address line 1" className="sm:col-span-2">
            <Input value={form.address?.line1 ?? ''} onChange={(e) => setAddr('line1', e.target.value)} disabled={!canWrite} />
          </FormField>
          <FormField label="Address line 2" className="sm:col-span-2">
            <Input value={form.address?.line2 ?? ''} onChange={(e) => setAddr('line2', e.target.value)} disabled={!canWrite} />
          </FormField>
          <FormField label="City">
            <Input value={form.address?.city ?? ''} onChange={(e) => setAddr('city', e.target.value)} disabled={!canWrite} />
          </FormField>
          <FormField label="State / region">
            <Input value={form.address?.state ?? ''} onChange={(e) => setAddr('state', e.target.value)} disabled={!canWrite} />
          </FormField>
          <FormField label="Postal code">
            <Input value={form.address?.postalCode ?? ''} onChange={(e) => setAddr('postalCode', e.target.value)} disabled={!canWrite} />
          </FormField>
          <FormField label="Country">
            <Input value={form.address?.country ?? ''} onChange={(e) => setAddr('country', e.target.value)} disabled={!canWrite} />
          </FormField>
        </Section>

        <Section title="Localization">
          <FormField label="Currency">
            <Input value={form.currency ?? ''} onChange={(e) => set('currency', e.target.value)} placeholder="INR" disabled={!canWrite} />
          </FormField>
          <FormField label="Locale">
            <Input value={form.locale ?? ''} onChange={(e) => set('locale', e.target.value)} placeholder="en-IN" disabled={!canWrite} />
          </FormField>
          <FormField label="Timezone" className="sm:col-span-2">
            <Input value={form.timezone ?? ''} onChange={(e) => set('timezone', e.target.value)} placeholder="Asia/Kolkata" disabled={!canWrite} />
          </FormField>
        </Section>

        <Section
          title="File storage"
          description="Where uploaded images (avatars, logos, product media) are stored."
        >
          <FormField label="Storage driver" className="sm:col-span-2">
            <Select value={form.uploadDriver ?? 'local'} onChange={(e) => set('uploadDriver', e.target.value)} disabled={!canWrite}>
              <option value="local">Local disk (this server)</option>
              <option value="s3">Amazon S3</option>
            </Select>
          </FormField>
          {form.uploadDriver === 's3' && (
            <>
              <FormField label="S3 bucket">
                <Input value={form.s3Bucket ?? ''} onChange={(e) => set('s3Bucket', e.target.value)} disabled={!canWrite} />
              </FormField>
              <FormField label="S3 region">
                <Input value={form.s3Region ?? ''} onChange={(e) => set('s3Region', e.target.value)} disabled={!canWrite} />
              </FormField>
              <FormField label="Access key ID">
                <Input value={form.s3AccessKeyId ?? ''} onChange={(e) => set('s3AccessKeyId', e.target.value)} disabled={!canWrite} />
              </FormField>
              <FormField label="Secret access key" hint="Write-only — never shown again after saving.">
                <PasswordInput value={form.s3SecretAccessKey ?? ''} onChange={(e) => set('s3SecretAccessKey', e.target.value)} disabled={!canWrite} autoComplete="off" />
              </FormField>
              <div className="sm:col-span-2">
                <Alert tone="warning">S3 uploads aren't wired up yet — keep <b>Local disk</b> selected until it is.</Alert>
              </div>
            </>
          )}
        </Section>
      </div>
    </div>
  );
}
