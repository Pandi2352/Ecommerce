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

/** Catalog filter facets from `/storefront/facets` — fully admin-driven. */
export interface Facets {
  priceRange: { min: number; max: number };
  brands: { id: string; name: string; count: number }[];
  attributes: { key: string; label: string; type: string; unit?: string; values: string[] }[];
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
