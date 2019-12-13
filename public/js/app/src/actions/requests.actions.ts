import {AxiosError, AxiosResponse, CancelTokenSource} from "axios";
import {IRequest} from '../../../../../src/interfaces/request.interface';
import {Dispatch} from "redux";
import ApiService from "../utils/axios";

export interface IRequestsState {
  requests: Array<IRequest>
  loading: boolean;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/REQUESTS/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/REQUESTS/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/REQUESTS/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/REQUESTS/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface ILoadRequests {
  type: '/REQUESTS/LOAD_REQUEST';
  payload: {
    requests: Array<IRequest>;
    count: number;
    pages: number
    page: number
  };
}

export function loadRequestsAction(requests: any[], count: number, pages: number, page: number): ILoadRequests {
  return {
    type: '/REQUESTS/LOAD_REQUEST',
    payload: {
      requests,
      count,
      pages,
      page
    }
  };
}

export function getRequestsAction(nextPage: number) {
  return (dispatch: Dispatch<RequestsReduxActions>, getState: () => {requests: IRequestsState}) => {
    const api: ApiService = new ApiService();
    const state = getState();
    // dispatch(isLoadingAction(true));
    const page = nextPage ? nextPage : state.requests.pagination.page;
    dispatch(cancelRequestAction(api.getSource()));
    api.getRequests(page)
      .then((response: AxiosResponse) => {
        const data = response.data;
        dispatch(loadRequestsAction(data.results, data.count, data.pages, page));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type RequestsReduxActions =
  ICancelRequest |
  IIsLoading |
  ILoadRequests;
