export type UserRole = 'ADMIN' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  full_name: string | null;
  cisf_id: string | null;
  mobile: string | null;
  is_active: boolean;
  must_change_password: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
  full_name?: string | null;
  cisf_id?: string | null;
  mobile?: string | null;
}

export interface UpdateUserRequest {
  full_name?: string | null;
  cisf_id?: string | null;
  mobile?: string | null;
  is_active?: boolean | null;
}

export interface RoleChangeRequest {
  role: UserRole;
}
