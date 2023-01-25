import { AxiosError, AxiosResponse } from 'axios';
import { Request } from 'express';
import type { IUser } from '../app/interfaces/user.interface';
import type { IUserModel } from '../app/schemas/user.schema';

export interface IResponseErrorData extends AxiosResponse {
  data: {
    error: string;
    status: number;
  };
}

export interface IAxiosError extends AxiosError {
  response: IResponseErrorData;
}

export interface IResponseData {
  data: any;
  status: number;
}

export interface IResponsePaginateData<S> {
  status: number;
  count?: number;
  pages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
  results: S;
}

export interface IRequest extends Request {
  user: IUserModel | IUser;
  files: Express.Multer.File[];
}

export interface IStringKeyObject<T> {
  [key: string]: T;
}

export interface IAnyObject {
  [key: string]: any;

  hasOwnProperty(property: string): boolean;
}
