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

export function getInventoriesAction(loading: boolean) {
  return (dispatch: Dispatch<InventoryReduxAction>) => {
    const api: ApiService = new ApiService();
    if (loading) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    api.getInventories()
      .then((response: AxiosResponse) => {
        const data = response.data;
        if (loading) {
          dispatch(isLoadingAction(false));
        }
        dispatch(loadAlertsAction(data.inventories));
      })
      .catch((err: AxiosError) => {
        if (loading) {
          dispatch(isLoadingAction(false));
        }
        api.errorHandler(err);
      });
  };
}

export function finishInventoryAction(id: string) {
  return (dispatch: Dispatch<InventoryReduxAction>) => {
    const api: ApiService = new ApiService();
    api.finishInventory(id)
      .then((response: AxiosResponse) => {
        const data = response.data;
        swal('Inventarios', data.message, 'success');
        dispatch(getInventoriesAction(false) as any);
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  };
}

export function deleteInventoryAction(id: string) {
  return (dispatch: Dispatch<InventoryReduxAction>) => {
    const api: ApiService = new ApiService();
    api.deleteInventory(id)
      .then((response: AxiosResponse) => {
        const data = response.data;
        swal('Inventarios', data.message, 'success');
        dispatch(getInventoriesAction(false) as any);
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  };
}

export type InventoryReduxAction = ICancelRequest | IIsLoading | ILoadInventories;
