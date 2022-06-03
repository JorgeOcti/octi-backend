import { UserTypes } from "../../../../../src/app/models/user.model.types";

export interface getUsersParams {
  page: number;
  type: UserTypes;
  search?: string;
  venue?: string;
  minified?: boolean;
  limit?: number;
}
