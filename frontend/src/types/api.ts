export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  code: string;
  field_errors?: Record<string, string[]>;
}

export type UserRole =
  | 'super_admin'
  | 'programme_manager'
  | 'lga_coordinator'
  | 'facility_manager'
  | 'midwife'
  | 'chw'
  | 'data_officer'
  | 'finance_officer'
  | 'auditor';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  programme_area_id: string | null;
  lga_id: string | null;
  ward_id: string | null;
  facility_id: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
