import { CancelTokenSource } from 'axios';
import { ICarrier } from '../../../../../src/interfaces/carrier.interface';
import { IReason } from '../../../../../src/interfaces/reason.interface';
import { IRequestItem } from '../../../../../src/interfaces/requestItem.interface';
import { IRequestItemStatus } from '../../../../../src/interfaces/requestItemStatus.interface';

export const REQUEST_ITEMS_CANCEL_REQUEST = '/REQUESTS_ITEMS/CANCEL_REQUEST';
export const REQUEST_ITEMS_IS_LOADING = '/REQUESTS_ITEMS/IS_LOADING';
export const REQUEST_ITEMS_LOAD_REASONS = '/REQUESTS_ITEMS/LOAD_REASONS';
export const REQUEST_ITEMS_LOAD_CARRIERS = '/REQUESTS_ITEMS/LOAD_CARRIERS';
export const REQUEST_ITEMS_LOAD_REQUESTS_ITEMS = '/REQUESTS_ITEMS/LOAD_REQUESTS_ITEMS';
export const REQUEST_ITEMS_LOAD_ITEM_STATUS = '/REQUESTS_ITEMS/LOAD_ITEM_STATUS';
export const REQUEST_ITEMS_CHANGE_ORDER = '/REQUESTS_ITEMS/CHANGE_ORDER';

export interface IRequestItemsState {
  requestItems: IRequestItem[];
  reasons: IReason[];
  carriers: ICarrier[];
  requestItemStatus: IRequestItemStatus[];
  requestItemStatusMin: number;
  requestItemStatusMax: number;
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

export interface ICancelRequestItems {
  type: typeof REQUEST_ITEMS_CANCEL_REQUEST;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingRequestItems {
  type: typeof REQUEST_ITEMS_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadReasonsRequestItems {
  type: typeof REQUEST_ITEMS_LOAD_REASONS;
  payload: {
    reasons: IReason[];
  };
}

export interface ILoadCarriersRequestItems {
  type: typeof REQUEST_ITEMS_LOAD_CARRIERS;
  payload: {
    carriers: ICarrier[];
  };
}

export interface ILoadRequestItemStatus {
  type: typeof REQUEST_ITEMS_LOAD_ITEM_STATUS;
  payload: {
    requestItemStatus: IRequestItemStatus[];
    min: number;
    max: number;
  };
}

export interface ILoadRequestItems {
  type: typeof REQUEST_ITEMS_LOAD_REQUESTS_ITEMS;
  payload: {
    requestItems: IRequestItem[];
    count: number;
    pages: number
    page: number
  };
}

export interface IChangeOrderRequestItems {
  type: typeof REQUEST_ITEMS_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type RequestItemsReduxActions =
  ICancelRequestItems |
  ILoadReasonsRequestItems |
  ILoadRequestItemStatus |
  ILoadRequestItems |
  ILoadCarriersRequestItems |
  IChangeOrderRequestItems |
  IIsLoadingRequestItems;
