import {Dispatch} from "redux";
import { AxiosError, AxiosResponse, default as Axios } from "axios";
import ApiService from "../utils/axios";
import {IFilterCar} from "../reducers/inventory.reducer";

export interface IInventoryDashboardState {
  venues: any[],
  monthly_report: any[],
  filter: IFilterCar,
  loading: boolean;
}

interface ILoadInventoryDashboard
{
  type: '/INVENTORY_DASHBOARD/LOAD_DATA';
  payload: {
    venues: any[],
    monthly_report: any[],
  }
}

export function loadInventoriesDashboardAction(venues: any[], monthly_report: any[]): ILoadInventoryDashboard {
  return {
    type: '/INVENTORY_DASHBOARD/LOAD_DATA',
    payload: {
      venues: venues,
      monthly_report: monthly_report
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

interface ILoadInventoryDashboardFiltered
{
  type: '/INVENTORY_DASHBOARD/LOAD_DATA_FILTERED';
  payload: {
    filter: IFilterCar,
    monthly_report: any[],
  }
}

export function loadInventoriesDashboardFilteredAction(filter: IFilterCar, monthly_report: any[]): ILoadInventoryDashboardFiltered {
  return {
    type: '/INVENTORY_DASHBOARD/LOAD_DATA_FILTERED',
    payload: {
      filter: filter,
      monthly_report: monthly_report
    }
  };
}

export function getInventoryDashboard() {
  return (dispatch: Dispatch<InventoryDashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    Axios.all([
      api.getVenues(1, 200),
      api.getInventoryDashboard(null)
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
