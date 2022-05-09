import { CancelTokenSource } from 'axios';
import { IPaymentMethod } from '../../../../../src/request/interfaces/paymentMethod.interface';

export const PAYMENT_METHOD_CANCEL = '/PAYMENT_METHOD/CANCEL';
export const PAYMENT_METHOD_IS_LOADING = '/PAYMENT_METHOD/IS_LOADING';
export const PAYMENT_METHOD_LOAD = '/PAYMENT_METHOD/LOAD';
export const PAYMENT_METHOD_CREATE = '/PAYMENT_METHOD/CREATE';
export const PAYMENT_METHOD_UDPATE = '/PAYMENT_METHOD/UDPATE';
export const PAYMENT_METHOD_DELETE = '/PAYMENT_METHOD/DELETE';
export const PAYMENT_METHOD_CHANGE_ORDER = '/PAYMENT_METHOD/CHANGE_ORDER';

export interface IPaymentMethodState {
  paymentMethods: IPaymentMethod[];
  loading: boolean;
  source: CancelTokenSource | null;
  options: {
    orderBy: string;
    orderType: string;
  };
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

export interface ICancelPaymentMethod {
  type: typeof PAYMENT_METHOD_CANCEL;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingPaymentMethod {
  type: typeof PAYMENT_METHOD_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadPaymentMethod {
  type: typeof PAYMENT_METHOD_LOAD;
  payload: {
    paymentMethods: IPaymentMethod[];
    count: number;
    pages: number
    page: number
  };
}

export interface ICreatePaymentMethod {
  type: typeof PAYMENT_METHOD_CREATE;
  payload: {
    reason: IPaymentMethod
  };
}

export interface IUpdatePaymentMethod {
  type: typeof PAYMENT_METHOD_UDPATE;
  payload: {
    reason: IPaymentMethod
  };
}

export interface IDeletePaymentMethod {
  type: typeof PAYMENT_METHOD_DELETE;
  payload: {
    reason: IPaymentMethod
  };
}

export interface IChangeOrderPaymentMethod {
  type: typeof PAYMENT_METHOD_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type PaymentMethodReduxActions =
  ICancelPaymentMethod |
  IIsLoadingPaymentMethod |
  ICreatePaymentMethod |
  IUpdatePaymentMethod |
  IDeletePaymentMethod |
  IChangeOrderPaymentMethod |
  ILoadPaymentMethod;
