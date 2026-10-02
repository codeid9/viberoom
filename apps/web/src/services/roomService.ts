import type { CreateRoomResponse } from '../types/room';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const createRoom = async (): Promise<CreateRoomResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Transmits session cookie
  });

  if (!response.ok) {
    let errorMessage = 'Failed to create room';
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
};

export const verifyRoomExists = async (roomId: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    return false;
  }

  return true;
};