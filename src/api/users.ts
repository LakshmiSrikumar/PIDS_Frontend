import apiClient from './client';
import type { User, CreateUserRequest, UpdateUserRequest, RoleChangeRequest } from '../types/user';

export const listUsers = async (): Promise<User[]> => {
  const { data } = await apiClient.get<User[]>('/users');
  return data;
};

export const createUser = async (payload: CreateUserRequest): Promise<User> => {
  const { data } = await apiClient.post<User>('/users', payload);
  return data;
};

export const getUser = async (id: string): Promise<User> => {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
};

export const updateUser = async (id: string, payload: UpdateUserRequest): Promise<User> => {
  const { data } = await apiClient.put<User>(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const { data } = await apiClient.delete<{ message: string }>(`/users/${id}`);
  return data;
};

export const changeUserRole = async (id: string, payload: RoleChangeRequest): Promise<User> => {
  const { data } = await apiClient.patch<User>(`/users/${id}/role`, payload);
  return data;
};

export const resetUserPassword = async (id: string): Promise<{ temp_password: string }> => {
  const { data } = await apiClient.post<{ temp_password: string }>(`/users/${id}/reset-password`);
  return data;
};
