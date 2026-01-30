import { ENUM_USER_POWER } from '../../../enum/power';

export type IPowerFilterRequest = {
  searchTerm?: string | undefined;
};

export type IPowerCreatedEvent = {
  name: ENUM_USER_POWER;
};
