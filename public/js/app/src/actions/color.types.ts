import { CancelTokenSource } from 'axios';
import { IColor } from '../../../../../src/app/interfaces/color.interface';
import { IRequestStatus } from '../../../../../src/request/interfaces/requestStatus.interface';
import { IForm } from '../../../../../src/form/interfaces/form.interface';

export const COLOR_CANCEL = '/COLOR/CANCEL';
export const COLOR_IS_LOADING = '/COLOR/IS_LOADING';
export const COLOR_LOAD = '/COLOR/LOAD';
export const COLOR_LOAD_FORMS = '/COLOR/LOAD_FORMS';
export const COLOR_LOAD_REQUEST = '/COLOR/LOAD_REQUEST';
export const COLOR_CREATE = '/COLOR/CREATE';
export const COLOR_UDPATE = '/COLOR/UDPATE';
export const COLOR_DELETE = '/COLOR/DELETE';
export const COLOR_CHANGE_ORDER = '/COLOR/CHANGE_ORDER';

export interface IColorState {
  colors: IColor[];
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

export interface ICancelColor {
  type: typeof COLOR_CANCEL;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingColor {
  type: typeof COLOR_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadFormsColor {
  type: typeof COLOR_LOAD_FORMS;
  payload: {
    forms: IForm[];
  };
}

export interface ILoadRequestStatusColor {
  type: typeof COLOR_LOAD_REQUEST;
  payload: {
    requestStatus: IRequestStatus[];
  };
}

export interface ILoadColor {
  type: typeof COLOR_LOAD;
  payload: {
    colors: IColor[];
    count: number;
    pages: number
    page: number
  };
}

export interface ICreateColor {
  type: typeof COLOR_CREATE;
  payload: {
    color: IColor
  };
}

export interface IUpdateColor {
  type: typeof COLOR_UDPATE;
  payload: {
    color: IColor
  };
}

export interface IDeleteColor {
  type: typeof COLOR_DELETE;
  payload: {
    color: IColor
  };
}

export interface IChangeOrderColor {
  type: typeof COLOR_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type ColorReduxActions =
  ICancelColor |
  IIsLoadingColor |
  ILoadFormsColor |
  ILoadRequestStatusColor |
  ICreateColor |
  IUpdateColor |
  IDeleteColor |
  IChangeOrderColor |
  ILoadColor;
