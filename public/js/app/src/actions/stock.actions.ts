import {AxiosError, AxiosResponse, CancelTokenSource} from "axios";
import {IInventoryCar} from '../../../../../src/interfaces/inventory.interface';
import {Dispatch} from "redux";
import ApiService from "../utils/axios";
import {IFilterStock} from "../reducers/stock.reducer";

export interface IStockState {
  cars: IInventoryCar[];
  carsTable: any[];
  filter: IFilterStock;
  dataFilters: {
    venues: any[];
    colors: any[];
    brands: any[];
    denominations: any[];
    types: any[];
    properties: any[];
  };
  vinInStock: any;
  searching: boolean;
  message: string;
  loading: boolean;
  source: CancelTokenSource | null;
}

interface ICancelRequest {
  type: '/STOCK/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/STOCK/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/STOCK/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/STOCK/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface ILoadStock {
  type: '/STOCK/LOAD';
  payload: {
    cars: IInventoryCar[];
    message: string;
  };
}

export function loadStockAction(cars: IInventoryCar[], message: string): ILoadStock {
  return {
    type: '/STOCK/LOAD',
    payload: {
      cars,
      message
    }
  };
}

interface IChangeFilter {
  type: '/STOCK/CHANGE_FILTER';
  payload: {
    filter: IFilterStock
  };
  meta: {
    debounce: {
      time: number
    }
  };
}

export function changeFilterText(filter: IFilterStock): IChangeFilter {
  return {
    type: '/STOCK/CHANGE_FILTER',
    payload: {
      filter
    },
    meta: {
      debounce: {
        time: 300
      }
    }
  };
}

export function changeFilter(filter: IFilterStock): IChangeFilter {
  return {
    type: '/STOCK/CHANGE_FILTER',
    payload: {
      filter
    },
    meta: {
      debounce: {
        time: 0
      }
    }
  };
}

export function getStockAction() {
  return (dispatch: Dispatch<StockReducerAction>) => {
    dispatch(isLoadingAction(true));
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    api.getStock()
      .then((response: AxiosResponse) => {
        dispatch(loadStockAction(response.data.cars, response.data.message));
        dispatch(isLoadingAction(false));
        // swal(response.data.message, {
        //   icon: 'success'
        // });
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type StockReducerAction =
  ICancelRequest |
  IChangeFilter |
  ILoadStock |
  IIsLoading;
