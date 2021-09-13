import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { IOperationType } from '../../../../../src/request/interfaces/operationType.interface';
import ApiService from '../utils/axios';
import {
  OPERATION_TYPE_IS_LOADING,
  OPERATION_TYPE_CHANGE_ORDER,
  OPERATION_TYPE_CANCEL_STATUS,
  OPERATION_TYPE_LOAD_STATUS,
  OPERATION_TYPE_CREATE_STATUS,
  OPERATION_TYPE_UDPATE_STATUS,
  OPERATION_TYPE_DELETE_STATUS,
  ICreateOperationType,
  ICancelOperationType,
  IIsLoadingOperationType,
  ILoadOperationType,
  IUpdateOperationType,
  IDeleteOperationType,
  IChangeOrderOperationType,
  IOperationTypeState,
  OperationTypeReduxActions
} from './operationType.types';

export function cancelOperationTypeAction(source: CancelTokenSource): ICancelOperationType {
  return {
    type: OPERATION_TYPE_CANCEL_STATUS,
    payload: {
      source
    }
  };
}

export function isLoadingOperationTypeAction(loading: boolean): IIsLoadingOperationType {
  return {
    type: OPERATION_TYPE_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadOperationTypeAction(operationTypes: IOperationType[], count: number, pages: number, page: number): ILoadOperationType {
  return {
    type: OPERATION_TYPE_LOAD_STATUS,
    payload: {
      operationTypes,
      count,
      pages,
      page
    }
  };
}


export function createOperationTypeItemAction(operationType: IOperationType): ICreateOperationType {
  return {
    type: OPERATION_TYPE_CREATE_STATUS,
    payload: {
      operationType
    }
  };
}

export function updateOperationTypeItemAction(operationType: IOperationType): IUpdateOperationType {
  return {
    type: OPERATION_TYPE_UDPATE_STATUS,
    payload: {
      operationType
    }
  };
}


export function deleteOperationTypeAction(operationType: IOperationType): IDeleteOperationType {
  return {
    type: OPERATION_TYPE_DELETE_STATUS,
    payload: {
      operationType
    }
  };
}

export function changeOrderOperationTypeAction(orderBy: string, orderType: string): IChangeOrderOperationType {
  return {
    type: OPERATION_TYPE_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getOperationTypesThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) {
  return (dispatch: Dispatch<OperationTypeReduxActions>, getState: () => { operationType: IOperationTypeState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingOperationTypeAction(hideLoading ? false : true));
    const page = nextPage ? nextPage : state.operationType.pagination.page;
    dispatch(changeOrderOperationTypeAction(orderBy, orderType));
    dispatch(cancelOperationTypeAction(api.getSource()));
    Axios
      .all([
        api.getOperationTypes({ page, orderBy, orderType })
      ])
      .then(Axios.spread((operationTypes) => {
        const { data } = operationTypes;
        dispatch(loadOperationTypeAction(data.results, data.count, data.pages, page));
        dispatch(isLoadingOperationTypeAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingOperationTypeAction(false));
        api.errorHandler(err);
      });
  };

}

export function createOperationTypeThunkAction(operationType: IOperationType) {
  return (dispatch: Dispatch<OperationTypeReduxActions>) => {
    const api: ApiService = new ApiService();
    api.createOperationType(operationType)
      .then((response: AxiosResponse) => {
        // dispatch(updateOperationTypeItemAction(idOperationType, data));
      });
  };
}

export function updateOperationTypeThunkAction(operationType: IOperationType) {
  return (dispatch: Dispatch<OperationTypeReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateOperationType(operationType)
      .then((response: AxiosResponse) => {
        // dispatch(updateOperationTypeItemAction(idOperationType, data));
      });
  };
}

export function deleteOperationTypeItemThunkAction(operationType: IOperationType) {
  return (dispatch: Dispatch<OperationTypeReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteOperationType(operationType)
      .then((response: AxiosResponse) => {
        // dispatch(updateOperationTypeItemAction(idOperationType, data));
      });
  };
}
