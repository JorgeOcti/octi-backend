import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { IRequestStatus } from '../../../../../src/interfaces/requestStatus.interface';
import ApiService from '../utils/axios';
import {
  REQUEST_IS_LOADING,
  REQUEST_CHANGE_ORDER,
  REQUEST_CANCEL_STATUS,
  REQUEST_LOAD_STATUS,
  REQUEST_CREATE_STATUS,
  REQUEST_UDPATE_STATUS,
  REQUEST_DELETE_STATUS,
  ICreateRequestStatus,
  ICancelRequestStatus,
  IIsLoadingRequestStatus,
  ILoadRequestStatus,
  IUpdateRequestStatus,
  IDeleteRequestStatus,
  IChangeOrderRequestStatus,
  IRequestStatusState,
  RequestStatusReduxActions
} from './requestStatus.types';

export function cancelRequestStatusAction(source: CancelTokenSource): ICancelRequestStatus {
  return {
    type: REQUEST_CANCEL_STATUS,
    payload: {
      source
    }
  };
}

export function isLoadingRequestStatusAction(loading: boolean): IIsLoadingRequestStatus {
  return {
    type: REQUEST_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadRequestStatusAction(status: IRequestStatus[], count: number, pages: number, page: number): ILoadRequestStatus {
  return {
    type: REQUEST_LOAD_STATUS,
    payload: {
      status,
      count,
      pages,
      page
    }
  };
}


export function createRequestStatusItemAction(reason: IRequestStatus): ICreateRequestStatus {
  return {
    type: REQUEST_CREATE_STATUS,
    payload: {
      reason
    }
  };
}

export function updateRequestStatusItemAction(reason: IRequestStatus): IUpdateRequestStatus {
  return {
    type: REQUEST_UDPATE_STATUS,
    payload: {
      reason
    }
  };
}


export function deleteRequestStatusAction(reason: IRequestStatus): IDeleteRequestStatus {
  return {
    type: REQUEST_DELETE_STATUS,
    payload: {
      reason
    }
  };
}

export function changeOrderRequestStatusAction(orderBy: string, orderType: string): IChangeOrderRequestStatus {
  return {
    type: REQUEST_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getRequestStatusThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) {
  return (dispatch: Dispatch<RequestStatusReduxActions>, getState: () => { requestStatus: IRequestStatusState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingRequestStatusAction(hideLoading ? false : true));
    const page = nextPage ? nextPage : state.requestStatus.pagination.page;
    dispatch(changeOrderRequestStatusAction(orderBy, orderType));
    dispatch(cancelRequestStatusAction(api.getSource()));
    Axios
      .all([
        api.getRequestItemsStatus({ page, orderBy, orderType })
      ])
      .then(Axios.spread((status) => {
        const { data } = status;
        dispatch(loadRequestStatusAction(data.results, data.count, data.pages, page));
        dispatch(isLoadingRequestStatusAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingRequestStatusAction(false));
        api.errorHandler(err);
      });
  };
}

export function createRequestStatusThunkAction(requestStatus: IRequestStatus) {
  return (dispatch: Dispatch<RequestStatusReduxActions>) => {
    const api: ApiService = new ApiService();
    api.createRequestItemsStatus(requestStatus)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestStatusItemAction(idRequestStatus, data));
      });
  };
}

export function updateRequestStatusThunkAction(requestStatus: IRequestStatus) {
  return (dispatch: Dispatch<RequestStatusReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateRequestItemsStatus(requestStatus)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestStatusItemAction(idRequestStatus, data));
      });
  };
}

export function deleteRequestStatusItemThunkAction(requestStatus: IRequestStatus) {
  return (dispatch: Dispatch<RequestStatusReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteRequestItemsStatus(requestStatus)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestStatusItemAction(idRequestStatus, data));
      });
  };
}