import { AxiosError, default as Axios } from 'axios';
import {Dispatch} from 'redux';
import {IFilterCar} from '../reducers/inventory.reducer';
import ApiService from '../utils/axios';

export interface IInventoryDashboardState {
  venues: any[];
  monthlyReport: any[];
  filter: IFilterCar;
  loading: boolean;
}

interface ILoadInventoryDashboard {
  type: '/INVENTORY_DASHBOARD/LOAD_DATA';
  payload: {
    venues: any[];
    monthlyReport: any[];
  };
}

export function loadInventoriesDashboardAction(venues: any[], monthlyReport: any[]): ILoadInventoryDashboard {
  return {
    type: '/INVENTORY_DASHBOARD/LOAD_DATA',
    payload: {
      venues,
      monthlyReport
    }
  };
}

interface IIsLoading {
  type: '/INVENTORY_DASHBOARD/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/INVENTORY_DASHBOARD/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface ILoadInventoryDashboardFiltered {
  type: '/INVENTORY_DASHBOARD/LOAD_DATA_FILTERED';
  payload: {
    filter: IFilterCar;
    monthlyReport: any[];
  };
}

export function loadInventoriesDashboardFilteredAction(filter: IFilterCar, monthlyReport: any[]): ILoadInventoryDashboardFiltered {
  return {
    type: '/INVENTORY_DASHBOARD/LOAD_DATA_FILTERED',
    payload: {
      filter,
      monthlyReport
    }
  };
}

export function getInventoryDashboard() {
  return (dispatch: Dispatch<InventoryDashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    Axios.all([
      api.getVenues(1, 200),
      api.getInventoryDashboard()
    ]).then(Axios.spread((venues, dashboard) => {
      dispatch(loadInventoriesDashboardAction(venues.data.results, dashboard.data));
    })).catch((err: AxiosError): void => {
      api.errorHandler(err);
    });
  };
}

export function getInventoryDashboardFiltered(filter: IFilterCar) {
  return (dispatch: Dispatch<InventoryDashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    api.getInventoryDashboard(filter)
      .then((dashboard) => {
        dispatch(loadInventoriesDashboardFilteredAction(filter, dashboard.data));
    }).catch((err: AxiosError): void => {
      api.errorHandler(err);
    });
  };
}

export type InventoryDashboardReduxAction = ILoadInventoryDashboard | ILoadInventoryDashboardFiltered | IIsLoading;
