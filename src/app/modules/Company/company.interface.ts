export type ICompanyFilterRequest = {
  searchTerm?: string | undefined;
  name?: string;
};

export type ICompanyCreatedEvent = {
  name: string;
  address: string;
};
