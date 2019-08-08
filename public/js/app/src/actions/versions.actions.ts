import {AxiosError, AxiosResponse, CancelTokenSource} from 'axios';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {IAlert} from '../../../../../src/interfaces/alert.interface';
import {IVersion} from '../../../../../src/interfaces/version.interface';
import {IUser} from '../../../../../src/interfaces/user.interface';
import ApiService from '../utils/axios';
import {showModal, statusFooterButttonsModal} from '../utils/common';

export interface IVersionsState {
  versions: IVersion[];
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
  type: '/VERSIONS/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/VERSIONS/IS_LOADING',
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
  return (dispatch: Dispatch<VersionReduxAction>) => {
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

interface ICreateVersion {
  type: '/VERSIONS/CREATE';
  payload: {
    version: IVersion;
  };
}

export function createVersion(version: IVersion): ICreateVersion {
  return {
    type: '/VERSIONS/CREATE',
    payload: {
      version
    }
  };
}

export function createVersionAction(version: any) {
  return (dispatch: Dispatch<VersionReduxAction>) => {
    dispatch(isLoadingAction(true));
    const api: ApiService = new ApiService();
    console.log("-- version", version)
    api.createVersion(version)
      .then((response: AxiosResponse) => {
        const data = response.data;
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(createVersion(data.version));
        dispatch(isLoadingAction(false));
        swal(response.data.message, {
          icon: 'success'
        });
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
        dispatch(isLoadingAction(false));
      });
  };
}

interface ILoadVersions {
  type: '/VERSIONS/LOAD_DATA';
  payload: {
    versions: IVersion[]
  };
}

export function loadVersionsAction(versions: IVersion[]): ILoadVersions {
  return {
    type: '/VERSIONS/LOAD_DATA',
    payload: {
      versions
    }
  };
}

export function getVersionsAction() {
  return (dispatch: Dispatch<VersionReduxAction>) => {
    const api: ApiService = new ApiService();
    // dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    api.getVersions()
      .then((response: AxiosResponse) => {
        const data = response.data;
        dispatch(loadVersionsAction(data.versions));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type VersionReduxAction =
  ICancelRequest |
  IIsLoading |
  ILoadVersions |
  IDeleteAlert |
  ICreateVersion;
