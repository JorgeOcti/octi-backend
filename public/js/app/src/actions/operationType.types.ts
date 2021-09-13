import { CancelTokenSource } from 'axios';
import { IOperationType } from '../../../../../src/request/interfaces/operationType.interface';

export const OPERATION_TYPE_CANCEL_STATUS = '/OPERATION_TYPE/CANCEL_STATUS';
export const OPERATION_TYPE_IS_LOADING = '/OPERATION_TYPE/IS_LOADING';
export const OPERATION_TYPE_LOAD_STATUS = '/OPERATION_TYPE/LOAD_STATUS';
export const OPERATION_TYPE_CREATE_STATUS = '/OPERATION_TYPE/CREATE_STATUS';
export const OPERATION_TYPE_UDPATE_STATUS = '/OPERATION_TYPE/UDPATE_STATUS';
export const OPERATION_TYPE_DELETE_STATUS = '/OPERATION_TYPE/DELETE_STATUS';
export const OPERATION_TYPE_CHANGE_ORDER = '/OPERATION_TYPE/CHANGE_ORDER';

export interface IOperationTypeState {
  operationTypes: IOperationType[];
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

export interface ICancelOperationType {
  type: typeof OPERATION_TYPE_CANCEL_STATUS;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingOperationType {
  type: typeof OPERATION_TYPE_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadOperationType {
  type: typeof OPERATION_TYPE_LOAD_STATUS;
  payload: {
    operationTypes: IOperationType[];
    count: number;
    pages: number
    page: number
  };
}

export interface ICreateOperationType {
  type: typeof OPERATION_TYPE_CREATE_STATUS;
  payload: {
    operationType: IOperationType
  };
}

export interface IUpdateOperationType {
  type: typeof OPERATION_TYPE_UDPATE_STATUS;
  payload: {
    operationType: IOperationType
  };
}

export interface IDeleteOperationType {
  type: typeof OPERATION_TYPE_DELETE_STATUS;
  payload: {
    operationType: IOperationType
  };
}

export interface IChangeOrderOperationType {
  type: typeof OPERATION_TYPE_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type OperationTypeReduxActions =
  ICancelOperationType |
  IIsLoadingOperationType |
  ICreateOperationType |
  IUpdateOperationType |
  IDeleteOperationType |
  IChangeOrderOperationType |
  ILoadOperationType;
