import type { AttributeType } from '@ecommerce/shared';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export type { AttributeType };

export interface AttributeDefinition {
  id: string;
  key: string;
  label: string;
  type: AttributeType;
  options: string[];
  unit?: string;
  group?: string;
  required: boolean;
  filterable: boolean;
  scope: 'all' | 'categories';
  categoryIds: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface AttributeInput {
  key?: string;
  label: string;
  type: AttributeType;
  options?: string[];
  unit?: string;
  group?: string;
  required?: boolean;
  filterable?: boolean;
  scope?: 'all' | 'categories';
  categoryIds?: string[];
  sortOrder?: number;
}

export interface PresetInfo {
  id: string;
  label: string;
  description: string;
  variantOptions: string[];
  fieldCount: number;
}

export const fetchAttributes = () => api.get<AttributeDefinition[]>('/attributes').then((r) => r.data);
export const createAttribute = (input: AttributeInput) =>
  api.post<AttributeDefinition>('/attributes', input).then((r) => r.data);
export const updateAttribute = (id: string, input: Partial<AttributeInput>) =>
  api.patch<AttributeDefinition>(`/attributes/${id}`, input).then((r) => r.data);
export const deleteAttribute = (id: string) => api.delete(`/attributes/${id}`).then(() => undefined);

export const fetchPresets = () => api.get<PresetInfo[]>('/attributes/presets').then((r) => r.data);
export const applyPreset = (presetId: string) =>
  api.post<{ added: number }>('/attributes/apply-preset', { presetId }).then((r) => r.data);

export function useAttributes() {
  const { data, ...rest } = useApi(fetchAttributes, { errorMessage: 'Failed to load product fields' });
  return { data: data ?? [], ...rest };
}
