import { CancelTokenSource } from 'axios';
import { IReason } from '../../../../../src/request/interfaces/reason.interface';

export const REASON_CANCEL_REASON = '/REASONS/CANCEL_REASON';
export const REASON_IS_LOADING = '/REASONS/IS_LOADING';
export const REASON_LOAD_REASONS = '/REASONS/LOAD_REASONS';
export const REASON_CREATE_REASON = '/REASONS/CREATE_REASON';
export const REASON_UDPATE_REASON = '/REASONS/UDPATE_REASON';
export const REASON_DELETE_REASON = '/REASONS/DELETE_REASON';
export const REASON_CHANGE_ORDER = '/REASONS/CHANGE_ORDER';

export interface IReasonsState {
  reasons: IReason[];
  reason: Partial<IReason> | IReason;
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

export interface ICancelReason {
  type: typeof REASON_CANCEL_REASON;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingReason {
  type: typeof REASON_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadReasons {
  type: typeof REASON_LOAD_REASONS;
  payload: {
    reasons: IReason[];
    count: number;
    pages: number
    page: number
  };
}

export interface ICreateReason {
  type: typeof REASON_CREATE_REASON;
  payload: {
    reason: IReason
  };
}

export interface IUpdateReason {
  type: typeof REASON_UDPATE_REASON;
  payload: {
    reason: IReason
  };
}

export interface IDeleteReason {
  type: typeof REASON_DELETE_REASON;
  payload: {
    reason: IReason
  };
}

export interface IChangeOrderReason {
  type: typeof REASON_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type ReasonsReduxActions =
  ICancelReason |
  IIsLoadingReason |
  ICreateReason |
  IUpdateReason |
  IDeleteReason |
  IChangeOrderReason |
  ILoadReasons;
