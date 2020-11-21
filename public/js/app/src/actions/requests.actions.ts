import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { response } from 'express';
import { number } from 'prop-types';
import { Dispatch } from 'redux';
import { ICarrier } from '../../../../../src/interfaces/carrier.interface';
import { IReason } from '../../../../../src/interfaces/reason.interface';
import { IRequest } from '../../../../../src/interfaces/request.interface';
import { IRequestItem } from '../../../../../src/interfaces/requestItem.interface';
import { IRequestItemStatus } from '../../../../../src/interfaces/requestItemStatus.interface';
import ApiService from '../utils/axios';
import {
  ICancelRequest,
  IIsLoading,
  ILoadCarriers,
  ILoadReasons,
  ILoadRequest,
  ILoadRequestItemStatus,
  ILoadRequests,
  IRequestsState,
  IUpdateRequestItemInDetail,
  IUpdateRequestItemInList,
  RequestsReduxActions,
  REQUEST_CANCEL_REQUEST,
  REQUEST_IS_LOADING,
  REQUEST_LOAD_CARRIERS,
  REQUEST_LOAD_REASONS,
  REQUEST_LOAD_REQUEST,
  REQUEST_LOAD_REQUESTS,
  REQUEST_LOAD_REQUEST_ITEM_STATUS,
  REQUEST_UDPATE_REQUEST_ITEM_IN_DETAIL,
  REQUEST_UDPATE_REQUEST_ITEM_IN_LIST
} from './requests.types';

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: REQUEST_CANCEL_REQUEST,
    payload: {
      source
    }
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: REQUEST_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadReasonsAction(reasons: IReason[]): ILoadReasons {
  return {
    type: REQUEST_LOAD_REASONS,
    payload: {
      reasons
    }
  };
}

export function loadRequestItemsStatusAction(requestItemStatus: IRequestItemStatus[], min: number, max: number): ILoadRequestItemStatus {
  return {
    type: REQUEST_LOAD_REQUEST_ITEM_STATUS,
    payload: {
      requestItemStatus,
      min,
      max
    }
  };
}

export function loadCarriersAction(carriers: ICarrier[]): ILoadCarriers {
  return {
    type: REQUEST_LOAD_CARRIERS,
    payload: {
      carriers
    }
  };
}

export function loadRequestsAction(requests: any[], count: number, pages: number, page: number): ILoadRequests {
  return {
    type: REQUEST_LOAD_REQUESTS,
    payload: {
      requests,
      count,
      pages,
      page
    }
  };
}

export function loadRequestAction(request: IRequest): ILoadRequest {
  return {
    type: REQUEST_LOAD_REQUEST,
    payload: {
      request
    }
  };
}

export function updateRequestItemActionInList(idRequest: string, item: IRequestItem): IUpdateRequestItemInList {
  return {
    type: REQUEST_UDPATE_REQUEST_ITEM_IN_LIST,
    payload: {
      idRequest,
      item
    }
  };
}

export function updateRequestItemActionInDetail(item: IRequestItem): IUpdateRequestItemInDetail {
  return {
    type: REQUEST_UDPATE_REQUEST_ITEM_IN_DETAIL,
    payload: {
      item
    }
  };
}

export function getRequestsAction(nextPage: number) {
  return (dispatch: Dispatch<RequestsReduxActions>, getState: () => { requests: IRequestsState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingAction(true));
    const page = nextPage ? nextPage : state.requests.pagination.page;
    dispatch(cancelRequestAction(api.getSource()));
    Axios
      .all([
        api.getRequests(page),
        api.getReasons(1, 200),
        api.getRequestItemsStatus(1, 200),
        api.getCarriers(1, 200)
      ])
      .then(Axios.spread((requests, reasons, requestItemStatus, carriers) => {
        const {data} = requests;
        dispatch(loadRequestsAction(data.results, data.count, data.pages, page));
        dispatch(loadReasonsAction(reasons.data.results));
        dispatch(loadRequestItemsStatusAction(requestItemStatus.data.results, requestItemStatus.data.min, requestItemStatus.data.max));
        dispatch(loadCarriersAction(carriers.data.results));
        dispatch(isLoadingAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function getRequestAction(id: string) {
  return (dispatch: Dispatch<RequestsReduxActions>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    Axios
      .all([
        api.getRequest(id),
        api.getReasons(1, 200),
        api.getRequestItemsStatus(1, 200),
        api.getCarriers(1, 200)
      ])
      .then(Axios.spread((request, reasons, requestItemStatus, carriers) => {
        const { data } = request;
        dispatch(loadRequestAction(data));
        dispatch(loadReasonsAction(reasons.data.results));
        dispatch(loadRequestItemsStatusAction(requestItemStatus.data.results, requestItemStatus.data.min, requestItemStatus.data.max));
        dispatch(loadCarriersAction(carriers.data.results));
        dispatch(isLoadingAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function updateRequestItemInListReduxAction(idRequest: string, item: IRequestItem) {
  return (dispatch: Dispatch<RequestsReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateRequestItem(item._id, item)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestItemActionInList(idRequest, data));
      });
  };
}

export function updateRequestItemInDetailReduxAction(idRequest: string, item: IRequestItem) {
  return (dispatch: Dispatch<RequestsReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateRequestItem(item._id, item)
      .then((response: AxiosResponse) => {
        const { data } = response;
        // dispatch(updateRequestItemActionInList(idRequest, data));
      });
  };
}
