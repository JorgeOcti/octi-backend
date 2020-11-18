import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { ICarrier } from '../../../../../src/interfaces/carrier.interface';
import { IReason } from '../../../../../src/interfaces/reason.interface';
import { IRequest } from '../../../../../src/interfaces/request.interface';
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
  RequestsReduxActions,
  REQUEST_CANCEL_REQUEST,
  REQUEST_IS_LOADING,
  REQUEST_LOAD_CARRIERS,
  REQUEST_LOAD_REASONS,
  REQUEST_LOAD_REQUEST,
  REQUEST_LOAD_REQUESTS,
  REQUEST_LOAD_REQUEST_ITEM_STATUS
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

export function loadRequestItemsAction(requestItemStatus: IRequestItemStatus[]): ILoadRequestItemStatus {
  return {
    type: REQUEST_LOAD_REQUEST_ITEM_STATUS,
    payload: {
      requestItemStatus
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
        const data = requests.data;
        dispatch(loadRequestsAction(data.results, data.count, data.pages, page));
        dispatch(loadReasonsAction(reasons.data.results));
        dispatch(loadRequestItemsAction(requestItemStatus.data.results));
        dispatch(loadCarriersAction(carriers.data.results));
        dispatch(isLoadingAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
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

export function getRequestAction(id: string) {
  return (dispatch: Dispatch<RequestsReduxActions>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    api.getRequest(id)
      .then((response: AxiosResponse) => {
        const { data } = response;
        document.title = `OSA Andes | Detalle Solicitud ${data.number}`;
        dispatch(loadRequestAction(data));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}
