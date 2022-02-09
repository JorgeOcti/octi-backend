import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { IPaymentMethod } from '../../../../../src/request/interfaces/paymentMethod.interface';
import ApiService from '../utils/axios';
import {
  ICancelPaymentMethod,
  IChangeOrderPaymentMethod,
  ICreatePaymentMethod,
  IDeletePaymentMethod,
  IIsLoadingPaymentMethod,
  ILoadPaymentMethod,
  IPaymentMethodState,
  IUpdatePaymentMethod,
  PAYMENT_METHOD_CANCEL,
  PAYMENT_METHOD_CHANGE_ORDER,
  PAYMENT_METHOD_CREATE,
  PAYMENT_METHOD_DELETE,
  PAYMENT_METHOD_IS_LOADING,
  PAYMENT_METHOD_LOAD,
  PAYMENT_METHOD_UDPATE,
  PaymentMethodReduxActions
} from './paymentMethod.types';

export function cancelPaymentMethodAction(source: CancelTokenSource): ICancelPaymentMethod {
  return {
    type: PAYMENT_METHOD_CANCEL,
    payload: {
      source
    }
  };
}

export function isLoadingPaymentMethodAction(loading: boolean): IIsLoadingPaymentMethod {
  return {
    type: PAYMENT_METHOD_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadPaymentMethodAction(paymentMethods: IPaymentMethod[], count: number, pages: number, page: number): ILoadPaymentMethod {
  return {
    type: PAYMENT_METHOD_LOAD,
    payload: {
      paymentMethods,
      count,
      pages,
      page
    }
  };
}


export function createPaymentMethodItemAction(reason: IPaymentMethod): ICreatePaymentMethod {
  return {
    type: PAYMENT_METHOD_CREATE,
    payload: {
      reason
    }
  };
}

export function updatePaymentMethodItemAction(reason: IPaymentMethod): IUpdatePaymentMethod {
  return {
    type: PAYMENT_METHOD_UDPATE,
    payload: {
      reason
    }
  };
}


export function deletePaymentMethodAction(reason: IPaymentMethod): IDeletePaymentMethod {
  return {
    type: PAYMENT_METHOD_DELETE,
    payload: {
      reason
    }
  };
}

export function changeOrderPaymentMethodAction(orderBy: string, orderType: string): IChangeOrderPaymentMethod {
  return {
    type: PAYMENT_METHOD_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getPaymentMethodThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) {
  return (dispatch: Dispatch<PaymentMethodReduxActions>, getState: () => { paymentMethod: IPaymentMethodState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingPaymentMethodAction(!hideLoading));
    const page = nextPage ? nextPage : state.paymentMethod.pagination.page;
    dispatch(changeOrderPaymentMethodAction(orderBy, orderType));
    dispatch(cancelPaymentMethodAction(api.getSource()));
    Axios
      .all([
        api.getPaymentMethods({ page, orderBy, orderType })
      ])
      .then(Axios.spread((channels) => {
        const { data } = channels;
        dispatch(loadPaymentMethodAction(data.results, data.count, data.pages, page));
        dispatch(isLoadingPaymentMethodAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingPaymentMethodAction(false));
        api.errorHandler(err);
      });
  };
}

export function createPaymentMethodThunkAction(paymentMethod: IPaymentMethod) {
  return (dispatch: Dispatch<PaymentMethodReduxActions>) => {
    const api: ApiService = new ApiService();
    api.createPaymentMethod(paymentMethod)
      .then((response: AxiosResponse) => {
        // dispatch(updatePaymentMethodItemAction(idPaymentMethod, data));
      });
  };
}

export function updatePaymentMethodThunkAction(paymentMethod: IPaymentMethod) {
  return (dispatch: Dispatch<PaymentMethodReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updatePaymentMethod(paymentMethod)
      .then((response: AxiosResponse) => {
        // dispatch(updatePaymentMethodItemAction(idPaymentMethod, data));
      });
  };
}

export function deletePaymentMethodItemThunkAction(paymentMethod: IPaymentMethod) {
  return (dispatch: Dispatch<PaymentMethodReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deletePaymentMethod(paymentMethod)
      .then((response: AxiosResponse) => {
        // dispatch(updatePaymentMethodItemAction(idPaymentMethod, data));
      });
  };
}
