import type { PaginationQuery } from '@ecommerce/shared';

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandStats {
  total: number;
  active: number;
  featured: number;
  totalProductsAttached: number;
}

export interface BrandFilterQuery extends PaginationQuery {
  status?: string;
  featured?: boolean;
}

export interface CreateBrandInput {
  name: string;
  slug?: string;
  logo?: string;
  banner?: string;
  website?: string;
  description?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export type UpdateBrandInput = Partial<CreateBrandInput>;
