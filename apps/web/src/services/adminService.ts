import type { ManagedUser, GetUsersResponse, CreateUserResponse } from '../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const handleResponse = async <T>(response: Response, defaultError: string): Promise<T> => {
  if (!response.ok) {
    let message = defaultError;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const fetchAdminUsers = async (): Promise<ManagedUser[]> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await handleResponse<GetUsersResponse>(response, 'Failed to fetch users');
  return data.users;
};

export const createAdminUser = async (username: string, password: string): Promise<ManagedUser> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });
  const data = await handleResponse<CreateUserResponse>(response, 'Failed to create user');
  return data.user;
};

export const updateUserStatusApi = async (userId: string, status: 'active' | 'revoked'): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
    credentials: 'include',
  });
  await handleResponse(response, 'Failed to update user status');
};

export const resetUserPasswordApi = async (userId: string, password: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
    credentials: 'include',
  });
  await handleResponse(response, 'Failed to reset password');
};

export const deleteUserApi = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await handleResponse(response, 'Failed to delete user');
};