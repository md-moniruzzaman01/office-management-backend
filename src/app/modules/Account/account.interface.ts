export type IAccountFilterRequest = {
  searchTerm?: string | undefined;
  branchId?: string | undefined;
};

export type IAccountCreatedEvent = {
  balance?: number;
};
