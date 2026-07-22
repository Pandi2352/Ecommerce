import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';

export type PageStatus = 'draft' | 'published';

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  status: PageStatus;
  showInFooter: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageInput {
  title: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  status?: PageStatus;
  showInFooter?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
}

export interface PageListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sort?: string;
}

export const fetchPages = async (
  query: Partial<PageListQuery> = {},
): Promise<{ data: CmsPage[]; meta: Meta }> => getList<CmsPage>('/pages', { params: query });

export const fetchPage = async (id: string): Promise<CmsPage> =>
  (await api.get<CmsPage>(`/pages/${id}`)).data;

export const createPage = async (input: PageInput): Promise<CmsPage> =>
  (await api.post<CmsPage>('/pages', input)).data;

export const updatePage = async (id: string, input: PageInput): Promise<CmsPage> =>
  (await api.patch<CmsPage>(`/pages/${id}`, input)).data;

export const deletePage = async (id: string): Promise<{ id: string }> =>
  (await api.delete<{ id: string }>(`/pages/${id}`)).data;
