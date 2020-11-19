import { CancelTokenSource } from 'axios';
import { ICarrier } from '../../../../../src/interfaces/carrier.interface';
import { IReason } from '../../../../../src/interfaces/reason.interface';
import { IRequest } from '../../../../../src/interfaces/request.interface';
import { IRequestItem } from '../../../../../src/interfaces/requestItem.interface';
import { IRequestItemStatus } from '../../../../../src/interfaces/requestItemStatus.interface';

export const REQUEST_CANCEL_REQUEST = '/REQUESTS/CANCEL_REQUEST';
export const REQUEST_IS_LOADING = '/REQUESTS/IS_LOADING';
export const REQUEST_LOAD_REASONS = '/REQUESTS/LOAD_REASONS';
export const REQUEST_LOAD_REQUEST_ITEM_STATUS = '/REQUESTS/LOAD_REQUEST_ITEM_STATUS';
export const REQUEST_LOAD_CARRIERS = '/REQUESTS/LOAD_CARRIERS';
export const REQUEST_LOAD_REQUESTS = '/REQUESTS/LOAD_REQUESTS';
export const REQUEST_LOAD_REQUEST = '/REQUESTS/LOAD_REQUEST';
export const REQUEST_UDPATE_REQUEST_ITEM_IN_LIST = '/REQUESTS/UDPATE_REQUEST_ITEM_IN_LIST';
export const REQUEST_UDPATE_REQUEST_ITEM_IN_DETAIL = '/REQUESTS/UDPATE_REQUEST_ITEM_IN_DETAIL';

export interface IRequestsState {
  requests: IRequest[];
  reasons: IReason[];
  carriers: ICarrier[];
  requestItemStatus: IRequestItemStatus[];
  request: Partial<IRequest>;
  loading: boolean;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

export interface ICancelRequest {
  type: typeof REQUEST_CANCEL_REQUEST;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoading {
  type: typeof REQUEST_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadReasons {
  type: typeof REQUEST_LOAD_REASONS;
  payload: {
    reasons: IReason[];
  };
}

export interface ILoadRequestItemStatus {
  type: typeof REQUEST_LOAD_REQUEST_ITEM_STATUS;
  payload: {
    requestItemStatus: IRequestItemStatus[];
  };
}

export interface ILoadCarriers {
  type: typeof REQUEST_LOAD_CARRIERS;
  payload: {
    carriers: ICarrier[];
  };
}

export interface ILoadRequests {
  type: typeof REQUEST_LOAD_REQUESTS;
  payload: {
    requests: IRequest[];
    count: number;
    pages: number
    page: number
  };
}

export interface IUpdateRequestItemInList {
  type: typeof REQUEST_UDPATE_REQUEST_ITEM_IN_LIST;
  payload: {
    idRequest: string;
    item: IRequestItem
  };
}

export interface IUpdateRequestItemInDetail {
  type: typeof REQUEST_UDPATE_REQUEST_ITEM_IN_DETAIL;
  payload: {
    item: IRequestItem
  };
}

export interface ILoadRequest {
  type: typeof REQUEST_LOAD_REQUEST;
  payload: {
    request: IRequest;
  };
}

export type RequestsReduxActions =
  ICancelRequest |
  IIsLoading |
  ILoadRequest |
  IUpdateRequestItemInList |
  IUpdateRequestItemInDetail |
  ILoadRequestItemStatus |
  ILoadReasons |
  ILoadCarriers |
  ILoadRequests;