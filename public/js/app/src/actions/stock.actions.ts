import {AxiosError, AxiosResponse, CancelTokenSource} from "axios";
import {IInventoryCar, IInventory} from '../../../../../src/inventory/interfaces/inventory.interface';
import {Dispatch} from "redux";
import ApiService from "../utils/axios";
import { Options } from "daterangepicker";
import {IFilterStock} from "../reducers/stock.reducer";

export interface IStockState {
  cars: any[];
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
  defaultSorted: any[];
  vinInStock: any;
  searching: boolean;
  message: string;
  loading: boolean;
  rangeOptions: Options;
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

interface IChangeOrder {
  type: '/STOCK/CHANGE_ORDER';
  payload: {
    order: any;
  }
}

export function changeOrder(order: any) {
  return {
    type: '/STOCK/CHANGE_ORDER',
    payload: {
      order
    }
  };
}

interface ILoadStock {
  type: '/STOCK/LOAD';
  payload: {
    inventories: IInventory[];
    cars: IInventoryCar[];
    message: string;
  };
}

export function loadStockAction(cars: IInventoryCar[], message: string, inventories: IInventory[]): ILoadStock {
  return {
    type: '/STOCK/LOAD',
    payload: {
      cars,
      message,
      inventories
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
    // dispatch(isLoadingAction(true));
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    api.getStock()
      .then((response: AxiosResponse) => {
        dispatch(loadStockAction(response.data.cars, response.data.message, response.data.inventories));
        dispatch(isLoadingAction(false));
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
  IChangeOrder |
  ILoadStock |
  IIsLoading;
