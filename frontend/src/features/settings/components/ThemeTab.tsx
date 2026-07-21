import { Card, FormField, Input, Select } from '@/components/ui';
import type { ThemeConfig } from '../storefront-settings.api';

interface Props {
  theme: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
  disabled?: boolean;
}

const COLOR_PRESETS = [
  { name: 'Indigo Spark (Default)', primary: '#6366f1', accent: '#ec4899' },
  { name: 'MaxShop Red', primary: '#dc2626', accent: '#f97316' },
  { name: 'Emerald Fresh', primary: '#10b981', accent: '#06b6d4' },
  { name: 'Royal Violet', primary: '#8b5cf6', accent: '#3b82f6' },
  { name: 'Midnight Dark', primary: '#3b82f6', accent: '#8b5cf6' },
];

export function ThemeTab({ theme, onChange, disabled }: Props) {
  const set = (key: keyof ThemeConfig, val: unknown) => {
    onChange({ ...theme, [key]: val });
  };

  const applyPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    onChange({ ...theme, primaryColor: preset.primary, accentColor: preset.accent });
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text">Storefront Theme & Colors</h3>
        <p className="mt-0.5 text-xs text-text-secondary">
          Customize your storefront brand colors, typography, button styles, and border radius.
        </p>

        {/* Quick Presets */}
        <div className="mt-4 border-b border-border pb-4">
          <span className="text-xs font-semibold text-text">Color Palette Presets</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                disabled={disabled}
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-1.5 text-xs font-medium hover:bg-surface"
              >
                <div className="flex size-4 overflow-hidden rounded-full border border-border">
                  <div className="h-full w-1/2" style={{ backgroundColor: preset.primary }} />
                  <div className="h-full w-1/2" style={{ backgroundColor: preset.accent }} />
                </div>
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Primary Color Picker */}
          <FormField
            label="Primary Brand Color"
            hint="Used for main buttons, navbar accents, headers"
          >
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor ?? '#6366f1'}
                onChange={(e) => set('primaryColor', e.target.value)}
                disabled={disabled}
                className="size-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
              />
              <Input
                value={theme.primaryColor ?? '#6366f1'}
                onChange={(e) => set('primaryColor', e.target.value)}
                disabled={disabled}
                placeholder="#6366f1"
              />
            </div>
          </FormField>

          {/* Accent Color Picker */}
          <FormField
            label="Accent / Sale Color"
            hint="Used for sale badges, secondary CTAs, highlights"
          >
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.accentColor ?? '#ec4899'}
                onChange={(e) => set('accentColor', e.target.value)}
                disabled={disabled}
                className="size-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
              />
              <Input
                value={theme.accentColor ?? '#ec4899'}
                onChange={(e) => set('accentColor', e.target.value)}
                disabled={disabled}
                placeholder="#ec4899"
              />
            </div>
          </FormField>

          {/* Button Style */}
          <FormField label="Button Style">
            <Select
              value={theme.buttonStyle ?? 'gradient'}
              onChange={(e) => set('buttonStyle', e.target.value)}
              disabled={disabled}
            >
              <option value="gradient">Gradient Shift (Modern)</option>
              <option value="solid">Solid Color</option>
              <option value="outline">Border Outline</option>
            </Select>
          </FormField>

          {/* Button Corner Radius */}
          <FormField label="Corner Radius">
            <Select
              value={theme.buttonRadius ?? '10px'}
              onChange={(e) => set('buttonRadius', e.target.value)}
              disabled={disabled}
            >
              <option value="4px">Sharp (4px)</option>
              <option value="6px">Standard (6px)</option>
              <option value="10px">Rounded (10px)</option>
              <option value="16px">Soft Pill (16px)</option>
              <option value="999px">Full Pill (Pill Shaped)</option>
            </Select>
          </FormField>

          {/* Typography */}
          <FormField label="Font Family" className="sm:col-span-2">
            <Select
              value={theme.fontFamily ?? 'Inter'}
              onChange={(e) => set('fontFamily', e.target.value)}
              disabled={disabled}
            >
              <option value="Inter">Inter (Clean Modern Sans-Serif)</option>
              <option value="Outfit">Outfit (Geometric Brand Sans)</option>
              <option value="Roboto">Roboto (Classic Standard)</option>
              <option value="System">System Default UI Font</option>
            </Select>
          </FormField>
        </div>
      </Card>
    </div>
  );
}
