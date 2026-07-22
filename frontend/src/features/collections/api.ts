import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';

export type ConditionField = 'tag' | 'brand' | 'category' | 'price' | 'featured' | 'onSale';
export type ConditionOperator = 'eq' | 'contains' | 'gt' | 'lt' | 'is';

export interface CollectionCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  type: 'manual' | 'auto';
  productIds: string[];
  match: 'all' | 'any';
  conditions: CollectionCondition[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  productCount?: number;
  createdAt?: string;
}

export interface CollectionInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  type?: 'manual' | 'auto';
  productIds?: string[];
  match?: 'all' | 'any';
  conditions?: CollectionCondition[];
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CollectionListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  status?: string;
  sort?: string;
}

/** Minimal product shape for the manual picker / preview. */
export interface PickerProduct {
  id: string;
  name: string;
  price: number;
  images?: string[];
  sku?: string;
}

export const fetchCollections = async (
  query: Partial<CollectionListQuery> = {},
): Promise<{ data: Collection[]; meta: Meta }> =>
  getList<Collection>('/collections', { params: query });

export const fetchCollection = async (id: string): Promise<Collection> =>
  (await api.get<Collection>(`/collections/${id}`)).data;

export const previewCollection = async (id: string): Promise<PickerProduct[]> =>
  (await api.get<PickerProduct[]>(`/collections/${id}/preview`)).data;

export const createCollection = async (input: CollectionInput): Promise<Collection> =>
  (await api.post<Collection>('/collections', input)).data;

export const updateCollection = async (id: string, input: CollectionInput): Promise<Collection> =>
  (await api.patch<Collection>(`/collections/${id}`, input)).data;

export const deleteCollection = async (id: string): Promise<{ id: string }> =>
  (await api.delete<{ id: string }>(`/collections/${id}`)).data;

/** Product search for the manual picker (admin catalog). */
export const searchProducts = async (search: string): Promise<PickerProduct[]> =>
  (
    await getList<PickerProduct>('/products', {
      params: { search: search || undefined, pageSize: 20 },
    })
  ).data;
