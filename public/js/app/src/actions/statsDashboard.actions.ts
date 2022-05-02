import {AxiosError, AxiosResponse, CancelTokenSource} from 'axios';
import {Dispatch} from 'redux';
import ApiService from '../utils/axios';
import {StatsDashboardTypes} from '../../../../../src/stats/models/studio.types';
import {IStudio} from '../../../../../src/stats/interfaces/studio.interface';
import {ITeam, IUser} from '../../../../../src/app/interfaces';
import * as swal from 'sweetalert';
import {showModal, statusFooterButttonsModal} from "../utils/common";
import {changeUserAction, getUsersAction, IUsersState, UserReduxAction} from "./users.actions";

export interface ITempStudio {
  _id?: string;
  name: string;
  embedURL: string;
  users: IUser[];
  type: string;
  team: ITeam | null
}


export interface IStatsDashboardState {
  loading: boolean;
  studios: IStudio[];
  tempStudio: ITempStudio;
  currentStudio: IStudio | null;
  users: IUser[];
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface IChangePage {
  type: '/STATS_DASHBOARD/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/STATS_DASHBOARD/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface IIsLoading {
  type: '/STATS_DASHBOARD/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/STATS_DASHBOARD/IS_LOADING',
    payload: {
      loading
    }
  };
}


interface IChangeTempStudio {
  type: '/STATS_DASHBOARD/CHANGE_TEMP_STUDIO';
  payload: {
    tempStudio: ITempStudio;
  };
  meta: {
    debounce: {
      time: number
    }
  };
}

export function changeTempStudioAction(tempStudio: ITempStudio): IChangeTempStudio {
  return {
    type: '/STATS_DASHBOARD/CHANGE_TEMP_STUDIO',
    payload: {
      tempStudio
    },
    meta: {
      debounce: {
        time: 100
      }
    }
  };
}


interface ILoadStudios {
  type: '/STATS_DASHBOARD/LOAD_STUDIOS';
  payload: {
    studios: IStudio[];
  };
}


export function loadStudiosAction(studios: IStudio[]): ILoadStudios {
  return {
    type: '/STATS_DASHBOARD/LOAD_STUDIOS',
    payload: {
      studios
    }
  };
}

export function getMyStudiosAction(type? : StatsDashboardTypes) {
  return (dispatch: Dispatch<StatsDashboardReducerAction>) => {
    dispatch(isLoadingAction(true));
    const api: ApiService = new ApiService();
    api.getMyStudiosDashboards(type)
      .then((response: AxiosResponse) => {
        dispatch(loadStudiosAction(response.data.studios));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function getStudiosAction(type? : StatsDashboardTypes) {
  return (dispatch: Dispatch<StatsDashboardReducerAction>) => {
    dispatch(isLoadingAction(true));
    const api: ApiService = new ApiService();
    api.getStudiosDashboards(type)
      .then((response: AxiosResponse) => {
        dispatch(loadStudiosAction(response.data.studios));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

interface IDeleteStudio {
  type: '/STATS_DASHBOARD/DELETE_USER';
  payload: {
    id: string;
  };
}

export function removeStudioAction(id: string): IDeleteStudio {
  return {
    type: '/STATS_DASHBOARD/DELETE_USER',
    payload: {
      id
    }
  };
}

export function deleteStudioAction(id: string) {
  return (dispatch: Dispatch<StatsDashboardReducerAction>) => {
    const api: ApiService = new ApiService();
    api.deleteStudio(id)
      .then((response: AxiosResponse): void => {
        dispatch(removeStudioAction(id));
        swal(response.data.message, {
          icon: 'success'
        });
        // effect when removing user
        $(`#studio-${id}`)
          .addClass('deleted-item');
        setTimeout(() => {
          dispatch(getStudiosAction() as any);
        }, 1000);
      })
      .catch((err: AxiosError): void => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

interface ILoadStudioUsers {
  type: '/STATS_DASHBOARD/LOAD_STUDIOS_USERS';
  payload: {
    users: IUser[];
  };
}

export function loadStudioUsers(users: IUser[]): ILoadStudioUsers {
  return {
    type: '/STATS_DASHBOARD/LOAD_STUDIOS_USERS',
    payload: {
      users
    }
  };
}

export function loadStudioUsersAction() {
  return (dispatch: Dispatch<StatsDashboardReducerAction>) => {
    dispatch(isLoadingAction(true));
    const api: ApiService = new ApiService();
    api.getStudioUsers()
      .then((response: AxiosResponse) => {
        dispatch(loadStudioUsers(response.data.results));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function createStudioAction() {
  return (dispatch: Dispatch<StatsDashboardReducerAction>, getState: () => {statsDashboard: IStatsDashboardState}) => {
    dispatch(isLoadingAction(true));
    const state = getState();
    const {tempStudio} = state.statsDashboard;
    const api: ApiService = new ApiService();
    api.createStudio(tempStudio)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(getStudiosAction() as any);
        swal(response.data.message, {
          icon: 'success'
        });
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function editStudioAction() {
  return (dispatch: Dispatch<StatsDashboardReducerAction>, getState: () => {statsDashboard: IStatsDashboardState}) => {
    dispatch(isLoadingAction(true));
    const state = getState();
    const {tempStudio} = state.statsDashboard;
    const api: ApiService = new ApiService();
    api.updateStudio(tempStudio)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(getStudiosAction() as any);
        $(`#studio-${tempStudio._id}`).addClass('editing-item');
        swal(response.data.message, {
          icon: 'success'
        });
        setTimeout(() => {
          $(`#studio-${tempStudio._id}`).removeClass('editing-item');
          console.log("remove editing-item");
        }, 1000);
      })
      .catch((err: AxiosError) => {
        console.log(err)
        statusFooterButttonsModal(false);
        $(`#studio-${tempStudio._id}`).removeClass('editing-item');
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}


export type StatsDashboardReducerAction =
  IIsLoading |
  ILoadStudios |
  IChangePage |
  IChangeTempStudio |
  IDeleteStudio |
  ILoadStudioUsers;


