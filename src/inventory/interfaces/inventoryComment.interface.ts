import { IUserModel } from '../../app/schemas/user.schema';

export interface IInventoryComment {
  _id?: any;
  user: IUserModel;
  comment: string;
  createdAt: Date;
}
