import { AxiosError, default as Axios } from 'axios';
import {Dispatch} from 'redux';
import {IFilterCar} from '../reducers/inventory.reducer';
import ApiService from '../utils/axios';
import {IInventorySettting} from '../../../../../src/interfaces/teamSetting.interface';

export interface IInventoryDashboardState {
  venues: any[];
  monthlyReport: any[];
  inventorySettings: IInventorySettting;
  filter: IFilterCar;
  loading: boolean;
}

interface ILoadInventoryDashboard {
  type: '/INVENTORY_DASHBOARD/LOAD_DATA';
  payload: {
    venues: any[];
    monthlyReport: any[];
    inventorySettings: any;
  };
}

export function loadInventoriesDashboardAction(venues: any[], monthlyReport: any[], inventorySettings: any): ILoadInventoryDashboard {
  return {
    type: '/INVENTORY_DASHBOARD/LOAD_DATA',
    payload: {
      venues,
      monthlyReport,
      inventorySettings
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
    inventorySettings: any;
  };
}

export function loadInventoriesDashboardFilteredAction(filter: IFilterCar, monthlyReport: any[], inventorySettings: any): ILoadInventoryDashboardFiltered {
  return {
    type: '/INVENTORY_DASHBOARD/LOAD_DATA_FILTERED',
    payload: {
      filter,
      monthlyReport,
      inventorySettings
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
      dispatch(loadInventoriesDashboardAction(venues.data.results, dashboard.data.data, dashboard.data.inventorySettings));
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
        dispatch(loadInventoriesDashboardFilteredAction(filter, dashboard.data.data, dashboard.data.inventorySettings));
    }).catch((err: AxiosError): void => {
      api.errorHandler(err);
    });
  };
}

export type InventoryDashboardReduxAction = ILoadInventoryDashboard | ILoadInventoryDashboardFiltered | IIsLoading;
