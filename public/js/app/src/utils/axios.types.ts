import { UserTypes } from '../actions/users.actions';

export interface getUsersParams {
  page: number;
  type: UserTypes;
  search?: string;
  venue?: string;
  minified?: boolean;
  limit?: number;
}
