import type { PaginationQuery, VendorStatus } from '@ecommerce/shared';

export interface VendorItem {
  _id: string;
  name: string;
  code: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  commissionRate: number;
  status: VendorStatus;
  notes?: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorStats {
  total: number;
  active: number;
  pending: number;
  totalProductsSupplied: number;
}

export interface VendorFilterQuery extends PaginationQuery {
  status?: VendorStatus;
}

export interface CreateVendorInput {
  name: string;
  code: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  commissionRate?: number;
  status?: VendorStatus;
  notes?: string;
}

export type UpdateVendorInput = Partial<CreateVendorInput>;
