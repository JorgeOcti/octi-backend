import {AxiosError, AxiosResponse, CancelTokenSource} from 'axios';
import {Dispatch} from 'redux';
import {IAlert} from '../../../../../src/interfaces/alert.interface';
import {IUser} from '../../../../../src/interfaces/user.interface';
import ApiService from '../utils/axios';

export interface IAlertsState {
  alerts: IAlert[];
  users: IUser[];
  loading: boolean;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/ALERTS/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/ALERTS/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/ALERTS/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/ALERTS/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface ILoadAlerts {
  type: '/ALERTS/LOAD_DATA';
  payload: {
    alerts: IAlert[];
    users: IUser[];
  };
}

export function loadAlertsAction(alerts: IAlert[], users: IUser[]): ILoadAlerts {
  return {
    type: '/ALERTS/LOAD_DATA',
    payload: {
      alerts,
      users
    }
  };
}

export function loadAlertsDataAction() {
  return (dispatch: Dispatch<AlertReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    api.getAlerts()
      .then((response: AxiosResponse) => {
        const data = response.data;
        dispatch(loadAlertsAction(data.alerts, data.users));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type AlertReduxAction = ICancelRequest | IIsLoading | ILoadAlerts;
