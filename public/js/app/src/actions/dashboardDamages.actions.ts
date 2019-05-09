import {AxiosError, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import ApiService from '../utils/axios';

export interface IDashboardDamagesState {
  data: any;
  venues: any[],
  loading: boolean;
}

interface ILoadDashboardDamages {
  type: '/DASHBOARD/DAMAGES/LOAD_DATA';
  payload: {
    venues: any[],
    data: any
  };
}

export function loadDashboardDamagesAction(venues: any[], data: any): ILoadDashboardDamages {
  return {
    type: '/DASHBOARD/DAMAGES/LOAD_DATA',
    payload: {
      venues,
      data
    }
  };
}

interface IIsLoading {
  type: '/DASHBOARD/DAMAGES/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/DASHBOARD/DAMAGES/IS_LOADING',
    payload: {
      loading
    }
  };
}


export function getDashboardDamages() {
  return (dispatch: Dispatch<DashboardDamagesReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    Axios.all([
      api.getVenues(1, 200),
      api.getDashboardDamages()
    ]).then(Axios.spread((venues, dashboard) => {
      dispatch(loadDashboardDamagesAction(venues.data.results, dashboard.data));
    })).catch((err: AxiosError): void => {
      api.errorHandler(err);
    });
  };
}

export type DashboardDamagesReduxAction = ILoadDashboardDamages | IIsLoading;
