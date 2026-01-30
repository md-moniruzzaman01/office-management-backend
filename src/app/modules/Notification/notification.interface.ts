export type INotificationFilterRequest = {
  searchTerm?: string | undefined;
  name?: string;
};

export type INotificationCreatedEvent = {
  name: string;
  address: string;
};
