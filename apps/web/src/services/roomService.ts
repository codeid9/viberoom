import type { CreateRoomResponse } from '../types/room';

// Fallback to local server URL if VITE_API_URL isn't explicitly configured in .env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const createRoom = async (): Promise<CreateRoomResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = 'Failed to create room';
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Fallback to standard error message if response is not valid JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
};