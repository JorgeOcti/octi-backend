import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { debounce } from 'throttle-debounce';
import { ICarrier } from '../../../../../src/interfaces/carrier.interface';
import { IReason } from '../../../../../src/interfaces/reason.interface';
import { IRequest } from '../../../../../src/interfaces/request.interface';
import { IRequestItem } from '../../../../../src/interfaces/requestItem.interface';
import { IRequestItemStatus } from '../../../../../src/interfaces/requestItemStatus.interface';
import ApiService from '../utils/axios';
import {
  ICancelRequest,
  IChangeOrderRequest,
  IDeleteRequestInList,
  IDeleteRequestItemInDetail,
  IDeleteRequestItemInList,
  IIsLoading,
  ILoadCarriers,
  ILoadReasons,
  ILoadRequest,
  ILoadRequestItemStatus,
  ILoadRequests,
  IRequestsState,
  ITabStatusRequest,
  IUpdateRequestItemInDetail,
  IUpdateRequestItemInList,
  RequestsReduxActions,
  REQUEST_CANCEL_REQUEST,
  REQUEST_CHANGE_ORDER,
  REQUEST_DELETE_REQUEST_IN_LIST,
  REQUEST_DELETE_REQUEST_ITEM_IN_DETAIL,
  REQUEST_DELETE_REQUEST_ITEM_IN_LIST,
  REQUEST_IS_LOADING,
  REQUEST_LOAD_CARRIERS,
  REQUEST_LOAD_REASONS,
  REQUEST_LOAD_REQUEST,
  REQUEST_LOAD_REQUESTS,
  REQUEST_LOAD_REQUEST_ITEM_STATUS,
  REQUEST_TAB_STATUS,
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

export function deleteRequestItemActionInList(idRequest: string, item: IRequestItem): IDeleteRequestItemInList {
  return {
    type: REQUEST_DELETE_REQUEST_ITEM_IN_LIST,
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

export function deleteRequestItemActionInDetail(item: IRequestItem): IDeleteRequestItemInDetail {
  return {
    type: REQUEST_DELETE_REQUEST_ITEM_IN_DETAIL,
    payload: {
      item
    }
  };
}

export function tabStatusAction(request: string): ITabStatusRequest {
  return {
    type: REQUEST_TAB_STATUS,
    payload: {
      request
    }
  };
}

export function deleteRequestActionInList(id: string): IDeleteRequestInList {
  return {
    type: REQUEST_DELETE_REQUEST_IN_LIST,
    payload: {
      id
    }
  };
}

export function chnageOrderAction(orderBy: string, orderType: string): IChangeOrderRequest {
  return {
    type: REQUEST_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getRequestsThunkAction(nextPage: number, orderBy: string, orderType: string) {
  return (dispatch: Dispatch<RequestsReduxActions>, getState: () => { requests: IRequestsState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingAction(true));
    const page = nextPage ? nextPage : state.requests.pagination.page;
    dispatch(chnageOrderAction(orderBy, orderType));
    dispatch(cancelRequestAction(api.getSource()));
    Axios
      .all([
        api.getRequests({page, orderBy, orderType}),
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

export function getRequestThunkAction(id: string) {
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

export function updateRequestItemInListThunkAction(idRequest: string, item: IRequestItem) {
  return (dispatch: Dispatch<RequestsReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateRequestItem(item._id, item)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestItemActionInList(idRequest, data));
      });
  };
}

export function deleteRequestItemThunkAction(item: IRequestItem) {
  return (dispatch: Dispatch<RequestsReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteRequestItem(item._id)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestItemActionInList(idRequest, data));
      });
  };
}

const debounceUpdateRequestItem = debounce(500, (item) => {
  const api: ApiService = new ApiService();
  api.updateRequestItem(item._id, item)
    // tslint:disable-next-line: no-empty
    .then((response: AxiosResponse) => { });
});
export function updateRequestItemInDetailThunkAction({ item, debounce }: { item: IRequestItem, debounce?: boolean}) {
  return (dispatch: Dispatch<RequestsReduxActions>) => {
    dispatch(updateRequestItemActionInDetail(item));
    if (debounce) {
      debounceUpdateRequestItem(item);
    } else {
      const api: ApiService = new ApiService();
      api.updateRequestItem(item._id, item)
        // tslint:disable-next-line: no-empty
        .then((response: AxiosResponse) => { });
    }
  };
}

export function deleteRequestThunkAction(id: string) {
  return (dispatch: Dispatch<RequestsReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteRequest(id)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestItemActionInList(idRequest, data));
      });
  };
}
