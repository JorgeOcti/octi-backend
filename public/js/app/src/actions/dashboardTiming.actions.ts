import {AxiosError, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import ApiService from '../utils/axios';

interface ITimingData {
  months: string[];
  overdue: number[];
  ontime: number[];
}

export interface IDashboardTimingState {
  data: any;
  venues: any[];
  venuesDict: any;
  loading: boolean;
  loadingPerVenue: boolean;
  perVenue: any;
}

interface ILoadDashboardTiming {
  type: '/DASHBOARD/TIMING/LOAD_DATA';
  payload: {
    venues: any[],
    data: any
  };
}

export function loadDashboardTimingAction(venues: any[], data: any): ILoadDashboardTiming {
  return {
    type: '/DASHBOARD/TIMING/LOAD_DATA',
    payload: {
      venues,
      data
    }
  };
}

interface IIsLoading {
  type: '/DASHBOARD/TIMING/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/DASHBOARD/TIMING/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IIsLoadingPerVenue {
  type: '/DASHBOARD/TIMING/IS_LOADING_PER_VENUE';
  payload: {
    loading: boolean;
  };
}

export function isLoadingPerVenueAction(loading: boolean): IIsLoadingPerVenue {
  return {
    type: '/DASHBOARD/TIMING/IS_LOADING_PER_VENUE',
    payload: {
      loading
    }
  };
}

export function getDashboardTiming(from: string, to: string) {
  return (dispatch: Dispatch<DashboardTimingReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    Axios.all([
      api.getVenues(1, 200),
      api.getDashboardTiming(from, to)
    ]).then(Axios.spread((venues, dashboard) => {
      dispatch(loadDashboardTimingAction(venues.data.results, dashboard.data));
    })).catch((err: AxiosError): void => {
      api.errorHandler(err);
    });
  };
}


export type DashboardTimingReduxAction = ILoadDashboardTiming | IIsLoading | IIsLoadingPerVenue;
