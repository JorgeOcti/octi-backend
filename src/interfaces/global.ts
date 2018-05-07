import {AxiosError, AxiosResponse} from 'axios';
import {Request} from 'express';

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

export interface IRequest extends Request {
  user: any;
}
