export type ITransactionFilterRequest = {
  searchTerm?: string | undefined;
  type?: string | undefined;
  branchId?: string | undefined;
};

export type ITransactionCreatedEvent = {
  accountId: number;
  note: string;
  type: string;
};
