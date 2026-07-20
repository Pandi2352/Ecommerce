export interface Meta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: Meta;
}

/** Product as exposed by the public storefront API (`/storefront/products`). */
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category?: string | null;
  images: string[];
  stock: number;
  attributes?: Record<string, unknown>;
  options?: { name: string; values: string[] }[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id?: string;
  sku?: string;
  optionValues: Record<string, string>;
  price: number;
  stock: number;
  image?: string;
  isActive?: boolean;
}
