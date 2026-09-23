export interface IMessageItem {
  _id: string;
  roomId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface GetMessagesResponse {
  messages: IMessageItem[];
}