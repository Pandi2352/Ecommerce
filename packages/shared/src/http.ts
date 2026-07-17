/** Shared HTTP contract types: the response envelope used by every list/detail endpoint. */

export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ApiMeta;
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}
