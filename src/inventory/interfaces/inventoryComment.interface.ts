import {IUserModel} from '../../app/models/user.model';

export interface IInventoryComment {
  _id?: any;
  user: IUserModel;
  comment: string;
  createdAt: Date;
}
