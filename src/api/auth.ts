import apiClient from './client';

export interface LoginResponse {
  token: string;
  role: string;
  must_change_password: boolean;
}

export const adminLogin = async (username: string, password: string) => {
  const { data } = await apiClient.post<LoginResponse>('/auth/admin/login', {
    username,
    password,
  });
  return data;
};

export const viewerLogin = async (
  cisf_id: string,
  username: string,
  password: string,
  full_name: string
) => {
  const { data } = await apiClient.post<LoginResponse>('/auth/viewer/login', {
    cisf_id,
    username,
    password,
    full_name,
  });
  return data;
};

export const logoutUser = async (reason?: string) => {
  await apiClient.post('/auth/logout', { reason: reason ?? null });
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const { data } = await apiClient.post('/auth/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return data;
};

// Setup-wizard endpoint. Creates the first admin and issues a
// session token in one shot — no separate login call. Backend
// rejects with 409 if any user already exists, so this is a true
// one-shot. The X-Skip-Auth-Redirect header keeps a 422 (bad
// password / mismatch / short username) from being hijacked by
// the global 401 interceptor.
export const initializeAdmin = async (
  username: string,
  newPassword: string,
  confirmNewPassword: string
): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>(
    '/auth/admin/initialize',
    {
      username,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    },
    { headers: { 'X-Skip-Auth-Redirect': '1' } }
  );
  return data;
};
