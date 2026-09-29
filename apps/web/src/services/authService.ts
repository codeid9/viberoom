import type { AuthResponse, AuthUser } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const loginApi = async (username: string, password: string): Promise<AuthUser> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include', // Automatically sets and accepts HttpOnly cookie
  });

  if (!response.ok) {
    let message = 'Invalid login credentials';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }

  const data: AuthResponse = await response.json();
  return data.user;
};

export const getMeApi = async (): Promise<AuthUser> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unauthenticated');
  }

  const data: AuthResponse = await response.json();
  return data.user;
};

export const logoutApi = async (): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
};