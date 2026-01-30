export type ITodoFilterRequest = {
  searchTerm?: string | undefined;
  assignedTo?: string | undefined;
  status?: string | undefined;
  createdById?: string | undefined;
  priority?: string | undefined;
};

export type ITodoCreatedEvent = {
  name: string;
  address: string;
};
