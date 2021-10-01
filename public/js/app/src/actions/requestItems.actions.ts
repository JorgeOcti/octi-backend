import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { debounce } from 'throttle-debounce';
import { ICarrier } from '../../../../../src/app/interfaces/carrier.interface';
import { IReason } from '../../../../../src/request/interfaces/reason.interface';
import { IRequestItem } from '../../../../../src/request/interfaces/requestItem.interface';
import { IRequestItemStatus } from '../../../../../src/request/interfaces/requestItemStatus.interface';
import { IVenue } from '../../../../../src/app/interfaces/venue.interface';
import ApiService from '../utils/axios';
import {
  ICancelRequestItems,
  IChangeFilterRequestItems,
  IChangeOrderRequestItems,
  ICreateRequestItems,
  IDeleteRequestItems,
  IIsLoadingRequestItems,
  ILoadCarriersRequestItems,
  ILoadPropertiesRequestItems,
  ILoadReasonsRequestItems,
  ILoadRequestItems,
  ILoadRequestItemStatus,
  ILoadVenuesRequestItems,
  IRequestItemsFilters,
  IRequestItemsState,
  IUpdateRequestItems,
  RequestItemsReduxActions,
  REQUEST_ITEMS_CANCEL_REQUEST,
  REQUEST_ITEMS_CHANGE_FILTER,
  REQUEST_ITEMS_CHANGE_ORDER,
  REQUEST_ITEMS_CREATE_ITEM,
  REQUEST_ITEMS_DELETE_ITEM,
  REQUEST_ITEMS_IS_LOADING,
  REQUEST_ITEMS_LOAD_CARRIERS,
  REQUEST_ITEMS_LOAD_ITEM_STATUS,
  REQUEST_ITEMS_LOAD_PROPERTIES,
  REQUEST_ITEMS_LOAD_REASONS,
  REQUEST_ITEMS_LOAD_REQUESTS_ITEMS,
  REQUEST_ITEMS_LOAD_VENUES,
  REQUEST_ITEMS_UPDATE_ITEM, REQUEST_ITEMS_LOAD_SETTINGS, ILoadSettingsRequestItems
} from './requestItems.types';
import { IRequestSettting } from '../../../../../src/app/interfaces/teamSetting.interface';

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

export function loadVenuesRequestItemsAction(venues: IVenue[]): ILoadVenuesRequestItems {
  return {
    type: REQUEST_ITEMS_LOAD_VENUES,
    payload: {
      venues
    }
  };
}

export function loadPropertiesRequestItemsAction(properties: ICarrier[]): ILoadPropertiesRequestItems {
  return {
    type: REQUEST_ITEMS_LOAD_PROPERTIES,
    payload: {
      properties
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

export function changeFilterRequestAction(key: keyof IRequestItemsFilters, value: any | any[]): IChangeFilterRequestItems {
  return {
    type: REQUEST_ITEMS_CHANGE_FILTER,
    payload: {
      key,
      value
    }
  };
}

export function createRequestItemAction(item: IRequestItem): ICreateRequestItems {
  return {
    type: REQUEST_ITEMS_CREATE_ITEM,
    payload: {
      item
    }
  };
}

export function updateRequestItemAction(item: IRequestItem): IUpdateRequestItems {
  return {
    type: REQUEST_ITEMS_UPDATE_ITEM,
    payload: {
      item
    }
  };
}

export function deleteRequestItemAction(item: IRequestItem): IDeleteRequestItems {
  return {
    type: REQUEST_ITEMS_DELETE_ITEM,
    payload: {
      item
    }
  };
}

export function loadRequestSettingsAction(requestSettings: IRequestSettting): ILoadSettingsRequestItems {
  return {
    type: REQUEST_ITEMS_LOAD_SETTINGS,
    payload: {
      requestSettings
    }
  };
}

export function getRequestItemsThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) {
  return (dispatch: Dispatch<RequestItemsReduxActions>, getState: () => { requestItems: IRequestItemsState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingRequestItemsAction(hideLoading ? false : true));
    const page = nextPage ? nextPage : state.requestItems.pagination.page;
    dispatch(changeOrderRequestAction(orderBy, orderType));
    dispatch(cancelRequestItemsAction(api.getSource()));
    Axios
      .all([
        api.getRequestItems({ page, orderBy, orderType, pageSize: 20, filters: state.requestItems.filters }),
        api.getReasons({ page: 1, pageSize: 200 }),
        api.getRequestItemsStatus({ page: 1, pageSize: 200 }),
        // api.getCarriers(1, 200),
        api.getVenues({ page: 1, pageSize: 200, noPopulate: true, filted: true }),
        api.getProperties(),
        api.getTeamSettings()
      ])
      .then(Axios.spread((requests, reasons, requestItemStatus/*, carriers*/, venues, properties, teamsettings) => {
        const { data } = requests;
        dispatch(loadRequestsItemsAction(data.results, data.count, data.pages, page));
        dispatch(loadReasonsRequestItemsAction(reasons.data.results));
        dispatch(loadRequestItemsStatusRequestAction(requestItemStatus.data.results, requestItemStatus.data.min, requestItemStatus.data.max));
        // dispatch(loadCarriersRequestItemsAction(carriers.data.results));
        dispatch(loadVenuesRequestItemsAction(venues.data.results));
        dispatch(loadPropertiesRequestItemsAction(properties.data));
        dispatch(isLoadingRequestItemsAction(false));
        dispatch(loadRequestSettingsAction(teamsettings.data.request));
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
    dispatch(updateRequestItemAction(item));
    if (debounce) {
      debounceUpdateRequestItem(item);
    } else {
      const api: ApiService = new ApiService();
      api.updateRequestItem(item._id, item)
        // tslint:disable-next-line: no-empty
        .then((response: AxiosResponse) => {

        });
    }
  };
}

export function deleteRequestItemsThunkAction(id: string) {
  return (dispatch: Dispatch<RequestItemsReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteRequestItem(id)
      .then((response: AxiosResponse) => {});
  };
}
