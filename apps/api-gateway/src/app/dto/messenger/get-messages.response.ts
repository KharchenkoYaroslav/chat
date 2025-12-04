class Message {
  id!: string;
  sender!: string;
  recipient!: string;
  content!: string;
  createdAt!: string;
}

export class GetMessagesResponse {
  messages!: Message[];
}
