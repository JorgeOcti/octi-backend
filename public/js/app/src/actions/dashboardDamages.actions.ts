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
    data: any
  };
}

export function loadDashboardDamagesAction(data: any): ILoadDashboardDamages {
  return {
    type: '/DASHBOARD/DAMAGES/LOAD_DATA',
    payload: {
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

export function getDashboardDamagesPerVenue(update?: boolean) {
  return (dispatch: Dispatch<DashboardDamagesReduxAction>) => {
    const api: ApiService = new ApiService();
    if (update) {
      dispatch(isLoadingAction(true));
    }
    Axios.all([
      api.getDashboardDamagesPerVenue()
    ]).then(Axios.spread((dashboard) => {
      dispatch(isLoadingAction(false));
      dispatch(loadDashboardDamagesAction(dashboard.data));
    })).catch((err: AxiosError): void => {
      dispatch(isLoadingAction(false));
      api.errorHandler(err);
    });
  };
}

export type DashboardDamagesReduxAction = ILoadDashboardDamages | IIsLoading;
