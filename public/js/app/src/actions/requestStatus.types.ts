import { CancelTokenSource } from 'axios';
import { IRequestStatus } from '../../../../../src/interfaces/requestStatus.interface';

export const REQUEST_CANCEL_STATUS = '/REQUEST/CANCEL_STATUS';
export const REQUEST_IS_LOADING = '/REQUEST/IS_LOADING';
export const REQUEST_LOAD_STATUS = '/REQUEST/LOAD_STATUS';
export const REQUEST_CREATE_STATUS = '/REQUEST/CREATE_STATUS';
export const REQUEST_UDPATE_STATUS = '/REQUEST/UDPATE_STATUS';
export const REQUEST_DELETE_STATUS = '/REQUEST/DELETE_STATUS';
export const REQUEST_CHANGE_ORDER = '/REQUEST/CHANGE_ORDER';

export interface IRequestStatusState {
  status: IRequestStatus[];
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

export interface ICancelRequestStatus {
  type: typeof REQUEST_CANCEL_STATUS;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingRequestStatus {
  type: typeof REQUEST_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadRequestStatus {
  type: typeof REQUEST_LOAD_STATUS;
  payload: {
    status: IRequestStatus[];
    count: number;
    pages: number
    page: number
  };
}

export interface ICreateRequestStatus {
  type: typeof REQUEST_CREATE_STATUS;
  payload: {
    reason: IRequestStatus
  };
}

export interface IUpdateRequestStatus {
  type: typeof REQUEST_UDPATE_STATUS;
  payload: {
    reason: IRequestStatus
  };
}

export interface IDeleteRequestStatus {
  type: typeof REQUEST_DELETE_STATUS;
  payload: {
    reason: IRequestStatus
  };
}

export interface IChangeOrderRequestStatus {
  type: typeof REQUEST_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type RequestStatusReduxActions =
  ICancelRequestStatus |
  IIsLoadingRequestStatus |
  ICreateRequestStatus |
  IUpdateRequestStatus |
  IDeleteRequestStatus |
  IChangeOrderRequestStatus |
  ILoadRequestStatus;