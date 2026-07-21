import { useEffect, useState } from 'react';
import { Layout, Palette, Image, Layers } from 'lucide-react';
import { Alert, Button, Skeleton, Tabs, TabItem } from '@/components/ui';
import { PageHeader } from '@/components/common';
import { useApi } from '@/hooks/useApi';
import { useMutation } from '@/hooks/useMutation';
import { useAuth } from '@/features/auth/AuthContext';
import {
  fetchStorefrontSettings,
  updateStorefrontSettings,
  type StorefrontSettings,
  type StorefrontSettingsInput,
} from './storefront-settings.api';

import { BannersTab } from './components/BannersTab';
import { ThemeTab } from './components/ThemeTab';
import { IdentityTab } from './components/IdentityTab';
import { SectionsTab } from './components/SectionsTab';

const empty: StorefrontSettingsInput = {
  storeName: 'NovaShop',
  theme: {
    primaryColor: '#6366f1',
    accentColor: '#ec4899',
    buttonRadius: '10px',
    buttonStyle: 'gradient',
  },
  banners: [],
  homepageSections: {
    showBanners: true,
    showFeatured: true,
    showBestSellers: true,
    showCategories: true,
    showDeals: true,
  },
};

export function StorefrontSettingsPage() {
  const { can } = useAuth();
  const canWrite = can('settings.write');
  const { data, loading, error, reload } = useApi<StorefrontSettings>(fetchStorefrontSettings, {
    errorMessage: 'Failed to load storefront settings',
  });

  const [form, setForm] = useState<StorefrontSettingsInput>(empty);
  const [activeTab, setActiveTab] = useState('banners');
  const save = useMutation();

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const setField = (key: keyof StorefrontSettingsInput, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSave = () => {
    void save.run(() => updateStorefrontSettings(form), {
      success: 'Storefront customization saved!',
      error: 'Save failed',
      onSuccess: () => void reload(),
    });
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <Alert>{error}</Alert>;

  const tabItems: TabItem[] = [
    {
      key: 'banners',
      label: (
        <span className="flex items-center gap-1.5">
          <Image className="size-4" /> Banners & Slides
        </span>
      ),
    },
    {
      key: 'theme',
      label: (
        <span className="flex items-center gap-1.5">
          <Palette className="size-4" /> Theme & Colors
        </span>
      ),
    },
    {
      key: 'identity',
      label: (
        <span className="flex items-center gap-1.5">
          <Layout className="size-4" /> Store Identity
        </span>
      ),
    },
    {
      key: 'sections',
      label: (
        <span className="flex items-center gap-1.5">
          <Layers className="size-4" /> Homepage Sections
        </span>
      ),
    },
  ];

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Storefront Customization"
        subtitle="Manage hero carousel banners, store theme colors, identity, and section visibility."
        action={
          canWrite && (
            <Button onClick={onSave} loading={save.saving}>
              Save storefront changes
            </Button>
          )
        }
      />

      {!canWrite && (
        <Alert tone="info">You are viewing storefront settings in read-only mode.</Alert>
      )}

      <Tabs tabs={tabItems} value={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === 'banners' && (
          <BannersTab
            banners={form.banners ?? []}
            onChange={(banners) => setField('banners', banners)}
            disabled={!canWrite}
          />
        )}

        {activeTab === 'theme' && (
          <ThemeTab
            theme={form.theme ?? {}}
            onChange={(theme) => setField('theme', theme)}
            disabled={!canWrite}
          />
        )}

        {activeTab === 'identity' && (
          <IdentityTab form={form} onChange={setField} disabled={!canWrite} />
        )}

        {activeTab === 'sections' && (
          <SectionsTab
            sections={form.homepageSections ?? {}}
            onChange={(sections) => setField('homepageSections', sections)}
            disabled={!canWrite}
          />
        )}
      </div>
    </div>
  );
}
