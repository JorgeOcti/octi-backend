import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { ISalesChannel } from '../../../../../src/interfaces/salesChannel.interface';
import ApiService from '../utils/axios';
import { ICancelRequestChannel, IIsLoadingRequestChannel, ILoadRequestChannel, ICreateRequestChannel, IUpdateRequestChannel, IDeleteRequestChannel, IChangeOrderRequestChannel, RequestChannelReduxActions, ISalesChannelState } from './requestChannel.types';
import { REQUEST_CANCEL_CHANNEL,
  REQUEST_IS_LOADING,
  REQUEST_LOAD_CHANNEL,
  REQUEST_CREATE_CHANNEL,
  REQUEST_UDPATE_CHANNEL,
  REQUEST_DELETE_CHANNEL,
  REQUEST_CHANGE_ORDER
} from './requestChannel.types';

export function cancelRequestChannelAction(source: CancelTokenSource): ICancelRequestChannel {
  return {
    type: REQUEST_CANCEL_CHANNEL,
    payload: {
      source
    }
  };
}

export function isLoadingRequestChannelAction(loading: boolean): IIsLoadingRequestChannel {
  return {
    type: REQUEST_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadRequestChannelAction(channels: ISalesChannel[], count: number, pages: number, page: number): ILoadRequestChannel {
  return {
    type: REQUEST_LOAD_CHANNEL,
    payload: {
      channels,
      count,
      pages,
      page
    }
  };
}


export function createRequestChannelItemAction(reason: ISalesChannel): ICreateRequestChannel {
  return {
    type: REQUEST_CREATE_CHANNEL,
    payload: {
      reason
    }
  };
}

export function updateRequestChannelItemAction(reason: ISalesChannel): IUpdateRequestChannel {
  return {
    type: REQUEST_UDPATE_CHANNEL,
    payload: {
      reason
    }
  };
}


export function deleteRequestChannelAction(reason: ISalesChannel): IDeleteRequestChannel {
  return {
    type: REQUEST_DELETE_CHANNEL,
    payload: {
      reason
    }
  };
}

export function changeOrderRequestChannelAction(orderBy: string, orderType: string): IChangeOrderRequestChannel {
  return {
    type: REQUEST_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getRequestChannelThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) {
  return (dispatch: Dispatch<RequestChannelReduxActions>, getState: () => { requestStatus: ISalesChannelState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingRequestChannelAction(hideLoading ? false : true));
    const page = nextPage ? nextPage : state.requestStatus.pagination.page;
    dispatch(changeOrderRequestChannelAction(orderBy, orderType));
    dispatch(cancelRequestChannelAction(api.getSource()));
    Axios
      .all([
        api.getSalesChannel({ page, orderBy, orderType })
      ])
      .then(Axios.spread((channels) => {
        const { data } = channels;
        dispatch(loadRequestChannelAction(data.results, data.count, data.pages, page));
        dispatch(isLoadingRequestChannelAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingRequestChannelAction(false));
        api.errorHandler(err);
      });
  };
}

export function createRequestChannelThunkAction(requestStatus: ISalesChannel) {
  return (dispatch: Dispatch<RequestChannelReduxActions>) => {
    const api: ApiService = new ApiService();
    api.createSalesChannel(requestStatus)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestChannelItemAction(idRequestChannel, data));
      });
  };
}

export function updateRequestChannelThunkAction(requestStatus: ISalesChannel) {
  return (dispatch: Dispatch<RequestChannelReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateSalesChannel(requestStatus)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestChannelItemAction(idRequestChannel, data));
      });
  };
}

export function deleteRequestChannelItemThunkAction(requestStatus: ISalesChannel) {
  return (dispatch: Dispatch<RequestChannelReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteSalesChannel(requestStatus)
      .then((response: AxiosResponse) => {
        // dispatch(updateRequestChannelItemAction(idRequestChannel, data));
      });
  };
}