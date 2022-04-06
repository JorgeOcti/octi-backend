import { CancelTokenSource } from 'axios';
import { ICarrier } from '../../../../../src/app/interfaces/carrier.interface';
import { IReason } from '../../../../../src/request/interfaces/reason.interface';
import { IRequest } from '../../../../../src/request/interfaces/request.interface';
import { IRequestItem } from '../../../../../src/request/interfaces/requestItem.interface';
import { IRequestItemStatus } from '../../../../../src/request/interfaces/requestItemStatus.interface';
import { IRequestSetting } from '../../../../../src/app/interfaces/teamSetting.interface';

export const REQUEST_CANCEL_REQUEST = '/REQUESTS/CANCEL_REQUEST';
export const REQUEST_IS_LOADING = '/REQUESTS/IS_LOADING';
export const REQUEST_LOAD_SETTINGS = '/REQUESTS/REQUEST_LOAD_SETTINGS';
export const REQUEST_LOAD_REASONS = '/REQUESTS/LOAD_REASONS';
export const REQUEST_LOAD_REQUEST_ITEM_STATUS = '/REQUESTS/LOAD_REQUEST_ITEM_STATUS';
export const REQUEST_LOAD_CARRIERS = '/REQUESTS/LOAD_CARRIERS';
export const REQUEST_LOAD_REQUESTS = '/REQUESTS/LOAD_REQUESTS';
export const REQUEST_LOAD_REQUEST = '/REQUESTS/LOAD_REQUEST';
export const REQUEST_CREATE_REQUEST_ITEM_IN_LIST = '/REQUESTS/CREATE_REQUEST_ITEM_IN_LIST';
export const REQUEST_UDPATE_REQUEST_ITEM_IN_LIST = '/REQUESTS/UDPATE_REQUEST_ITEM_IN_LIST';
export const REQUEST_DELETE_REQUEST_ITEM_IN_LIST = '/REQUESTS/DELETE_REQUEST_ITEM_IN_LIST';
export const REQUEST_UDPATE_REQUEST_ITEM_IN_DETAIL = '/REQUESTS/UDPATE_REQUEST_ITEM_IN_DETAIL';
export const REQUEST_DELETE_REQUEST_ITEM_IN_DETAIL = '/REQUESTS/DELETE_REQUEST_ITEM_IN_DETAIL';
export const REQUEST_CREATE_REQUEST_ITEM_IN_DETAIL = '/REQUESTS/CREATE_REQUEST_ITEM_IN_DETAIL';
export const REQUEST_DELETE_REQUEST_IN_LIST = '/REQUESTS/DELETE_REQUEST_IN_LIST';
export const REQUEST_TAB_STATUS = '/REQUESTS/TAB_STATUS';
export const REQUEST_LOAD_ITEMS = '/REQUESTS/LOAD_ITEMS';
export const REQUEST_CHANGE_ORDER = '/REQUESTS/CHANGE_ORDER';

export interface IRequestsState {
  requests: IRequest[];
  requestItems: IRequestItem[];
  reasons: IReason[];
  carriers: ICarrier[];
  requestOpen: string[];
  requestItemsById: any;
  requestItemStatus: IRequestItemStatus[];
  requestItemStatusMin: number;
  requestItemStatusMax: number;
  request: Partial<IRequest> | IRequest;
  loading: boolean;
  source: CancelTokenSource | null;
  requestSettings: IRequestSetting;
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

export interface ICancelRequest {
  type: typeof REQUEST_CANCEL_REQUEST;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingRequest {
  type: typeof REQUEST_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadReasonsRequest {
  type: typeof REQUEST_LOAD_REASONS;
  payload: {
    reasons: IReason[];
  };
}

export interface ILoadRequestItemStatus {
  type: typeof REQUEST_LOAD_REQUEST_ITEM_STATUS;
  payload: {
    requestItemStatus: IRequestItemStatus[];
    min: number;
    max: number;
  };
}

export interface ILoadSettingsRequest {
  type: typeof REQUEST_LOAD_SETTINGS;
  payload: {
    requestSettings: IRequestSetting;
  };
}

export interface ILoadCarriersRequest {
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

export interface ICreateRequestItemInList {
  type: typeof REQUEST_CREATE_REQUEST_ITEM_IN_LIST;
  payload: {
    idRequest: string;
    item: IRequestItem
  };
}

export interface IUpdateRequestItemInList {
  type: typeof REQUEST_UDPATE_REQUEST_ITEM_IN_LIST;
  payload: {
    request: string;
    item: IRequestItem
  };
}

export interface IDeleteRequestItemInList {
  type: typeof REQUEST_DELETE_REQUEST_ITEM_IN_LIST;
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

export interface ICreateRequestItemInDetail {
  type: typeof REQUEST_CREATE_REQUEST_ITEM_IN_DETAIL;
  payload: {
    item: IRequestItem
  };
}

export interface IDeleteRequestItemInDetail {
  type: typeof REQUEST_DELETE_REQUEST_ITEM_IN_DETAIL;
  payload: {
    item: IRequestItem
  };
}

export interface IDeleteRequestInList {
  type: typeof REQUEST_DELETE_REQUEST_IN_LIST;
  payload: {
    id: string;
  };
}

export interface ILoadRequest {
  type: typeof REQUEST_LOAD_REQUEST;
  payload: {
    request: IRequest;
  };
}

export interface ITabStatusRequest {
  type: typeof REQUEST_TAB_STATUS;
  payload: {
    request: string;
  };
}

export interface ILoadItemsRequest {
  type: typeof REQUEST_LOAD_ITEMS;
  payload: {
    request: string;
    items: any;
  };
}

export interface IChangeOrderRequest {
  type: typeof REQUEST_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type RequestsReduxActions =
  ICancelRequest |
  IIsLoadingRequest |
  ILoadRequest |
  ILoadItemsRequest |
  ICreateRequestItemInList |
  IUpdateRequestItemInList |
  IDeleteRequestItemInList |
  IDeleteRequestInList |
  ILoadSettingsRequest |
  ICreateRequestItemInDetail |
  IUpdateRequestItemInDetail |
  IDeleteRequestItemInDetail |
  ILoadRequestItemStatus |
  IChangeOrderRequest |
  ILoadReasonsRequest |
  ILoadCarriersRequest |
  ITabStatusRequest |
  ILoadRequests;
