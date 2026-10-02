export interface AuthUser {
  username: string;
  role: 'admin' | 'user';
  status: 'active' | 'revoked';
}

export interface AuthResponse {
  message?: string;
  user: AuthUser;
}