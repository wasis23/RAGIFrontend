// ============================================================
// API TYPES — Generic response wrapper for Laravel Sanctum Backend
// ============================================================

export interface ApiResponse<T = any> {
  status?: 'success' | 'error';
  success?: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  status?: 'success' | 'error';
  success?: boolean;
  message: string;
  data: {
    items: T[];
    meta: PaginationMeta;
  } | T[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
