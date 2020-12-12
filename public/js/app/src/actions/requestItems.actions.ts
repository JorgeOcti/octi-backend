import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { debounce } from 'throttle-debounce';
import { ICarrier } from '../../../../../src/interfaces/carrier.interface';
import { IReason } from '../../../../../src/interfaces/reason.interface';
import { IRequestItem } from '../../../../../src/interfaces/requestItem.interface';
import { IRequestItemStatus } from '../../../../../src/interfaces/requestItemStatus.interface';
import ApiService from '../utils/axios';
import {
  ICancelRequestItems,
  IChangeOrderRequestItems,
  IIsLoadingRequestItems,
  ILoadCarriersRequestItems,
  ILoadReasonsRequestItems,
  ILoadRequestItems,
  ILoadRequestItemStatus,
  IRequestItemsState,
  RequestItemsReduxActions,
  REQUEST_ITEMS_CANCEL_REQUEST,
  REQUEST_ITEMS_CHANGE_ORDER,
  REQUEST_ITEMS_IS_LOADING,
  REQUEST_ITEMS_LOAD_CARRIERS,
  REQUEST_ITEMS_LOAD_ITEM_STATUS,
  REQUEST_ITEMS_LOAD_REASONS,
  REQUEST_ITEMS_LOAD_REQUESTS_ITEMS
} from './requestItems.types';

export function cancelRequestItemsAction(source: CancelTokenSource): ICancelRequestItems {
  return {
    type: REQUEST_ITEMS_CANCEL_REQUEST,
    payload: {
      source
    }
  };
}

export function isLoadingRequestItemsAction(loading: boolean): IIsLoadingRequestItems {
  return {
    type: REQUEST_ITEMS_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadReasonsRequestItemsAction(reasons: IReason[]): ILoadReasonsRequestItems {
  return {
    type: REQUEST_ITEMS_LOAD_REASONS,
    payload: {
      reasons
    }
  };
}

export function loadCarriersRequestItemsAction(carriers: ICarrier[]): ILoadCarriersRequestItems {
  return {
    type: REQUEST_ITEMS_LOAD_CARRIERS,
    payload: {
      carriers
    }
  };
}

export function loadRequestItemsStatusRequestAction(requestItemStatus: IRequestItemStatus[], min: number, max: number): ILoadRequestItemStatus {
  return {
    type: REQUEST_ITEMS_LOAD_ITEM_STATUS,
    payload: {
      requestItemStatus,
      min,
      max
    }
  };
}

export function loadRequestsItemsAction(requestItems: IRequestItem[], count: number, pages: number, page: number): ILoadRequestItems {
  return {
    type: REQUEST_ITEMS_LOAD_REQUESTS_ITEMS,
    payload: {
      requestItems,
      count,
      pages,
      page
    }
  };
}

export function changeOrderRequestAction(orderBy: string, orderType: string): IChangeOrderRequestItems {
  return {
    type: REQUEST_ITEMS_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getRequestItemsThunkAction(nextPage: number, orderBy: string, orderType: string) {
  return (dispatch: Dispatch<RequestItemsReduxActions>, getState: () => { requestItems: IRequestItemsState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingRequestItemsAction(true));
    const page = nextPage ? nextPage : state.requestItems.pagination.page;
    dispatch(changeOrderRequestAction(orderBy, orderType));
    dispatch(cancelRequestItemsAction(api.getSource()));
    Axios
      .all([
        api.getRequestItems({ page, orderBy, orderType, pageSize: 15 }),
        api.getReasons(1, 200),
        api.getRequestItemsStatus(1, 200),
        api.getCarriers(1, 200)
      ])
      .then(Axios.spread((requests, reasons, requestItemStatus, carriers) => {
        const { data } = requests;
        dispatch(loadRequestsItemsAction(data.results, data.count, data.pages, page));
        dispatch(loadReasonsRequestItemsAction(reasons.data.results));
        dispatch(loadRequestItemsStatusRequestAction(requestItemStatus.data.results, requestItemStatus.data.min, requestItemStatus.data.max));
        dispatch(loadCarriersRequestItemsAction(carriers.data.results));
        dispatch(isLoadingRequestItemsAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingRequestItemsAction(false));
        api.errorHandler(err);
      });
  };
}


const debounceUpdateRequestItem = debounce(500, (item) => {
  const api: ApiService = new ApiService();
  api.updateRequestItem(item._id, item)
    // tslint:disable-next-line: no-empty
    .then((response: AxiosResponse) => { });
});
export function updateRequestItemsThunkAction({ item, debounce }: { item: IRequestItem, debounce?: boolean}) {
  return (dispatch: Dispatch<RequestItemsReduxActions>) => {
    // dispatch(updateRequestItemActionInDetail(item));
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
