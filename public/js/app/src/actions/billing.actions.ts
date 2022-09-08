import {IInvoice} from '../../../../../src/billing/interfaces/invoice.interface';
import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from "axios";
import {Dispatch} from "redux";
import ApiService from "../utils/axios";

export interface IBillingState {
  invoices: IInvoice[];
  loading: boolean;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/BILLING/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/BILLING/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/BILLING/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/BILLING/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/BILLING/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/BILLING/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface ILoadBilling {
  type: '/BILLING/LOAD_BILLING';
  payload: {
    invoices: any;
    count: number;
    pages: number
  };
}

export function loadBillingAction(invoices: any, count: number, pages: number): ILoadBilling {
  return {
    type: '/BILLING/LOAD_BILLING',
    payload: {
      invoices,
      count,
      pages
    }
  };
}

export function getBillingAction(nextPage: number) {
  return (dispatch: Dispatch<BillingReduxAction>, getState: () => {labels: IBillingState}) => {
    const api: ApiService = new ApiService();
    const state = getState();
    if (nextPage && nextPage !== state.labels.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.labels.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getBilling(page)
      .then((response: AxiosResponse) => {
        dispatch(loadBillingAction(response.data.results, response.data.count, response.data.pages));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          dispatch(isLoadingAction(true));
        } else {
          dispatch(isLoadingAction(false));
          api.errorHandler(err);
        }
      });
  };
}

export function getInvoiceAction(nextPage: number) {
  return (dispatch: Dispatch<BillingReduxAction>, getState: () => {labels: IBillingState}) => {
    const api: ApiService = new ApiService();
    const state = getState();
    if (nextPage && nextPage !== state.labels.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.labels.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getBilling(page)
      .then((response: AxiosResponse) => {
        dispatch(loadBillingAction(response.data.results, response.data.count, response.data.pages));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          dispatch(isLoadingAction(true));
        } else {
          dispatch(isLoadingAction(false));
          api.errorHandler(err);
        }
      });
  };
}

export type BillingReduxAction = IIsLoading
  | ICancelRequest
  | ILoadBilling
  | IChangePage;
