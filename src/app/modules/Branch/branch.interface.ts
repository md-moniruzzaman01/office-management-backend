export type IBranchFilterRequest = {
  searchTerm?: string | undefined;
  name?: string;
  companyId?: string;
};

export type IBranchCreatedEvent = {
  name: string;
  address: string;
};
