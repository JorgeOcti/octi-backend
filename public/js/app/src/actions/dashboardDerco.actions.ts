import {AxiosError, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import ApiService from '../utils/axios';

interface ICleaningData {
  loading: boolean,
  days: [],
  clean: [],
  notClean: []
}

export interface IDashboardDercoState {
  cleaning: ICleaningData
}

interface ILoadDashboardCleaning {
  type: '/DASHBOARD/CLEANING/LOAD_DATA_DAILY';
  payload: {
    cleaning: ICleaningData,
  };
}

export function loadDashboardCleaningAction(cleaning: ICleaningData): ILoadDashboardCleaning {
  return {
    type: '/DASHBOARD/CLEANING/LOAD_DATA_DAILY',
    payload: {
      cleaning
    }
  };
}

interface IIsLoading {
  type: '/DASHBOARD/CLEANING/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/DASHBOARD/CLEANING/IS_LOADING',
    payload: {
      loading
    }
  };
}

export function getDashboardCleaning() {
  return (dispatch: Dispatch<DashboardDercoReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    Axios.all([
      api.getVenues({ page: 1, pageSize: 200 }),
      api.getDashboardCleaning()
    ]).then(Axios.spread((venues, dashboard) => {
      dispatch(loadDashboardCleaningAction(dashboard.data));
    })).catch((err: AxiosError): void => {
      api.errorHandler(err);
    });
  };
}

export type DashboardDercoReduxAction = ILoadDashboardCleaning | IIsLoading
