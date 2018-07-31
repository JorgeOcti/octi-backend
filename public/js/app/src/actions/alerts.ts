import {AxiosError, AxiosResponse, CancelTokenSource} from 'axios';
import {Dispatch} from 'redux';
import {IAlert} from '../../../../../src/interfaces/alert.interface';
import {IUser} from '../../../../../src/interfaces/user.interface';
import ApiService from '../utils/axios';
import {removeUserAction} from "./users";

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

interface IDeleteAlert {
  type: '/ALERTS/DELETE';
  payload: {
    id: string;
  };
}

export function deleteAlert(id: string): IDeleteAlert {
  return {
    type: '/ALERTS/DELETE',
    payload: {
      id
    }
  };
}

export function deleteAlertAction(id: string) {
  return (dispatch: Dispatch<AlertReduxAction>) => {
    const api: ApiService = new ApiService();
    api.deleteAlert(id)
      .then((response: AxiosResponse) => {
        const data = response.data;
        swal(response.data.message, {
          icon: 'success'
        });
        $(`#alert-${id}`)
          .addClass('deleted-item');
        setTimeout(() => {
          dispatch(deleteAlert(data.id));
        }, 500);
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
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

export type AlertReduxAction = ICancelRequest | IIsLoading | ILoadAlerts | IDeleteAlert;
