import {AxiosError, AxiosResponse, CancelTokenSource} from 'axios';
import {Dispatch} from 'redux';
import ApiService from '../utils/axios';

export interface IInventoryState {
  inventories: any[];
  loading: boolean;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/INVENTORORIES/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/INVENTORORIES/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/INVENTORORIES/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/INVENTORORIES/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface ILoadInventories {
  type: '/INVENTORORIES/LOAD_DATA';
  payload: {
    inventories: any[];
  };
}

export function loadAlertsAction(inventories: any[]): ILoadInventories {
  return {
    type: '/INVENTORORIES/LOAD_DATA',
    payload: {
      inventories
    }
  };
}

export function getInventoriesAction() {
  return (dispatch: Dispatch<InventoryReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    api.getInventories()
      .then((response: AxiosResponse) => {
        const data = response.data;
        dispatch(isLoadingAction(false));
        dispatch(loadAlertsAction(data.inventories));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type InventoryReduxAction = ICancelRequest | IIsLoading | ILoadInventories;
