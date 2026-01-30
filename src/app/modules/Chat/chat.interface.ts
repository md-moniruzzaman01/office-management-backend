// Message filter request type for querying messages
export type IMessageFilterRequest = {
  searchTerm?: string | undefined; // Optional search term for filtering messages
  senderId?: number | undefined; // Optional filter by sender ID
  receiverId?: number | undefined; // Optional filter by receiver ID
  chatRoomId?: number | undefined; // Optional filter by chat room ID
};

// Message creation event type when a new message is created
export type IMessageCreatedEvent = {
  content: string; // Content of the message
  senderId: number; // Sender's user ID
  receiverId?: number; // Optional receiver's user ID
  chatRoomId?: number; // Optional chat room ID where the message belongs
};
