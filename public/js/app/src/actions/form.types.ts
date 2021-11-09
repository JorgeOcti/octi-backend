import { CancelTokenSource } from 'axios';
import { IForm } from '../../../../../src/form/interfaces/form.interface';

export const FORM_CANCEL_STATUS = '/FORM/CANCEL_STATUS';
export const FORM_IS_LOADING = '/FORM/IS_LOADING';
export const FORM_LOAD_STATUS = '/FORM/LOAD_STATUS';
export const FORM_CREATE_STATUS = '/FORM/CREATE_STATUS';
export const FORM_UDPATE_STATUS = '/FORM/UDPATE_STATUS';
export const FORM_DELETE_STATUS = '/FORM/DELETE_STATUS';
export const FORM_CHANGE_ORDER = '/FORM/CHANGE_ORDER';

export interface IFormsState {
  forms: IForm[];
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

export interface ICancelForm {
  type: typeof FORM_CANCEL_STATUS;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingForm {
  type: typeof FORM_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadForm {
  type: typeof FORM_LOAD_STATUS;
  payload: {
    forms: IForm[];
    count: number;
    pages: number
    page: number
  };
}

export interface ICreateForm {
  type: typeof FORM_CREATE_STATUS;
  payload: {
    form: IForm
  };
}

export interface IUpdateForm {
  type: typeof FORM_UDPATE_STATUS;
  payload: {
    form: IForm
  };
}

export interface IDeleteForm {
  type: typeof FORM_DELETE_STATUS;
  payload: {
    form: IForm
  };
}

export interface IChangeOrderForm {
  type: typeof FORM_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type FormReduxActions =
  ICancelForm |
  IIsLoadingForm |
  ICreateForm |
  IUpdateForm |
  IDeleteForm |
  IChangeOrderForm |
  ILoadForm;
