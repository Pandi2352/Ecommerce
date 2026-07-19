/**
 * Shared API response types — mirror the backend envelope in
 * `docs/08-api-conventions.md`. The axios interceptor (`lib/api.ts`) unwraps the
 * `{ statusCode, success, message, data, meta }` success envelope, so callers
 * receive `data` directly and (for lists) `meta` alongside it.
 */

/** Pagination metadata returned with every list endpoint. */
export interface Meta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** A paginated list result after the envelope is unwrapped. */
export interface Paginated<T> {
  data: T[];
  meta: Meta;
}
