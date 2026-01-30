export type IDepartmentFilterRequest = {
  searchTerm?: string | undefined;
  branchId?: string | undefined;
};

export type IDepartmentCreatedEvent = {
  name: string;
};
