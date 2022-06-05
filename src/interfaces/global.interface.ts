import {AxiosError, AxiosResponse} from 'axios';
import {Request} from 'express';
import { IUser } from '../app/interfaces';

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
  user: IUser;
  files: Express.Multer.File[];
}

export interface IStringKeyObject<T> {
  [key: string]: T;
}

export interface IAnyObject {
  [key: string]: any;

  hasOwnProperty(property: string): boolean;
}
