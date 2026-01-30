// Fields that can be used for filtering messages
export const messageFilterableFields = [
  'searchTerm', // for searching by content or any other string fields
  'id', // to filter by message ID
  'senderId', // filter messages based on sender's ID
  'receiverId', // filter messages based on receiver's ID
  'chatRoomId', // filter messages based on the chat room ID
  'createdAt', // filter by creation date (optional)
];

// Fields that can be searched by text
export const messageSearchableFields = ['content'];
