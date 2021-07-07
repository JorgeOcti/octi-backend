import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { IReason } from '../../../../../src/interfaces/reason.interface';
import ApiService from '../utils/axios';
import {
  ICancelReason,
  IChangeOrderReason,
  ICreateReason,
  IDeleteReason,
  IIsLoadingReason,
  ILoadReasons,
  IReasonsState,
  IUpdateReason,
  ReasonsReduxActions, REASON_CANCEL_REASON,
  REASON_CHANGE_ORDER,
  REASON_CREATE_REASON,
  REASON_DELETE_REASON,
  REASON_IS_LOADING,
  REASON_LOAD_REASONS,
  REASON_UDPATE_REASON
} from './reasons.types';

export function cancelReasonAction(source: CancelTokenSource): ICancelReason {
  return {
    type: REASON_CANCEL_REASON,
    payload: {
      source
    }
  };
}

export function isLoadingReasonAction(loading: boolean): IIsLoadingReason {
  return {
    type: REASON_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadReasonsAction(reasons: any[], count: number, pages: number, page: number): ILoadReasons {
  return {
    type: REASON_LOAD_REASONS,
    payload: {
      reasons,
      count,
      pages,
      page
    }
  };
}


export function createReasonItemAction(reason: IReason): ICreateReason {
  return {
    type: REASON_CREATE_REASON,
    payload: {
      reason
    }
  };
}

export function updateReasonItemAction(reason: IReason): IUpdateReason {
  return {
    type: REASON_UDPATE_REASON,
    payload: {
      reason
    }
  };
}

export function deleteReasonItemAction(reason: IReason): IDeleteReason {
  return {
    type: REASON_DELETE_REASON,
    payload: {
      reason
    }
  };
}

export function deleteReasonAction(reason: IReason): IDeleteReason {
  return {
    type: REASON_DELETE_REASON,
    payload: {
      reason
    }
  };
}

export function changeOrderReasonAction(orderBy: string, orderType: string): IChangeOrderReason {
  return {
    type: REASON_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getReasonsThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) {
  return (dispatch: Dispatch<ReasonsReduxActions>, getState: () => { requests: IReasonsState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingReasonAction(!hideLoading));
    const page = nextPage ? nextPage : state.requests.pagination.page;
    dispatch(changeOrderReasonAction(orderBy, orderType));
    dispatch(cancelReasonAction(api.getSource()));
    Axios
      .all([
        api.getReasons({ page, orderBy, orderType })
      ])
      .then(Axios.spread((reasons) => {
        const { data } = reasons;
        dispatch(loadReasonsAction(data.results, data.count, data.pages, page));
        // dispatch(loadCarriersReasonAction(carriers.data.results));
        dispatch(isLoadingReasonAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingReasonAction(false));
        api.errorHandler(err);
      });
  };
}

export function createReasonThunkAction(reason: IReason) {
  return (dispatch: Dispatch<ReasonsReduxActions>) => {
    const api: ApiService = new ApiService();
    api.createReason(reason)
      .then((response: AxiosResponse) => {
        console.log('response', response);
        // dispatch(updateReasonItemAction(idReason, data));
      });
  };
}

export function updateReasonThunkAction(reason: IReason) {
  return (dispatch: Dispatch<ReasonsReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateReason(reason)
      .then((response: AxiosResponse) => {
        console.log('response', response);
        // dispatch(updateReasonItemAction(idReason, data));
      });
  };
}

export function deleteReasonThunkAction(reason: IReason) {
  return (dispatch: Dispatch<ReasonsReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteReason(reason)
      .then((response: AxiosResponse) => {
        console.log('response', response);
        // dispatch(updateReasonItemAction(idReason, data));
      });
  };
}
