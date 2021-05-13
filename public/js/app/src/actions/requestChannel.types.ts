import { CancelTokenSource } from 'axios';
import { ISalesChannel } from '../../../../../src/interfaces/salesChannel.interface';

export const REQUEST_CANCEL_CHANNEL = '/REQUEST/CANCEL_CHANNEL';
export const REQUEST_IS_LOADING = '/REQUEST/IS_LOADING';
export const REQUEST_LOAD_CHANNEL = '/REQUEST/LOAD_CHANNEL';
export const REQUEST_CREATE_CHANNEL = '/REQUEST/CREATE_CHANNEL';
export const REQUEST_UDPATE_CHANNEL = '/REQUEST/UDPATE_CHANNEL';
export const REQUEST_DELETE_CHANNEL = '/REQUEST/DELETE_CHANNEL';
export const REQUEST_CHANGE_ORDER = '/REQUEST/CHANGE_ORDER';

export interface ISalesChannelState {
  channels: ISalesChannel[];
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

export interface ICancelRequestChannel {
  type: typeof REQUEST_CANCEL_CHANNEL;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingRequestChannel {
  type: typeof REQUEST_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadRequestChannel {
  type: typeof REQUEST_LOAD_CHANNEL;
  payload: {
    channels: ISalesChannel[];
    count: number;
    pages: number
    page: number
  };
}

export interface ICreateRequestChannel {
  type: typeof REQUEST_CREATE_CHANNEL;
  payload: {
    reason: ISalesChannel
  };
}

export interface IUpdateRequestChannel {
  type: typeof REQUEST_UDPATE_CHANNEL;
  payload: {
    reason: ISalesChannel
  };
}

export interface IDeleteRequestChannel {
  type: typeof REQUEST_DELETE_CHANNEL;
  payload: {
    reason: ISalesChannel
  };
}

export interface IChangeOrderRequestChannel {
  type: typeof REQUEST_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type RequestChannelReduxActions =
  ICancelRequestChannel |
  IIsLoadingRequestChannel |
  ICreateRequestChannel |
  IUpdateRequestChannel |
  IDeleteRequestChannel |
  IChangeOrderRequestChannel |
  ILoadRequestChannel;