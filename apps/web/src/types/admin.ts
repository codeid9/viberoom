export interface ManagedUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  status: 'active' | 'revoked';
  createdAt: string;
  lastLoginAt: string | null;
}

export interface GetUsersResponse {
  users: ManagedUser[];
}

export interface CreateUserPayload {
  username: string;
  password: string;
}

export interface CreateUserResponse {
  message: string;
  user: ManagedUser;
}