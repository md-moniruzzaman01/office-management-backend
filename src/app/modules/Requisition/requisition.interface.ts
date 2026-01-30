export type IRequisitionFilterRequest = {
  searchTerm?: string | undefined;
  title?: string;
};

export type IRequisitionCreatedEvent = {
  title?: string;
};
