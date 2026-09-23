import type { GetMessagesResponse, IMessageItem } from '../types/message';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchRoomMessages = async (roomId: string): Promise<IMessageItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/messages`);

  if (!response.ok) {
    let errorMessage = 'Failed to load messages';
    try {
      const errorData = await response.json();
      if (errorData?.error) errorMessage = errorData.error;
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  const data: GetMessagesResponse = await response.json();
  return data.messages;
};