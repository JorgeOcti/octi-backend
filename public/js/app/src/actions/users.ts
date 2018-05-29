import {AxiosError, AxiosResponse} from "axios";
import {Dispatch} from "redux";
import ApiService from "../utils/axios";

export interface IUsersState {
  users: any;
  loading: boolean;
}

interface IIsLoading {
  type: 'IS_LOADING';
  payload:{
    loading: boolean;
  }
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: 'IS_LOADING',
    payload: {
      loading
    }
  }
}

interface ILoadUsers {
  type: 'LOAD_USERS';
  payload: {
    users: any;
  }
}

export function loadUserAction(users: any): ILoadUsers {
  return {
    type: 'LOAD_USERS',
    payload: {
      users
    }
  }
}

export function getUsersAction() {
  return (dispatch: Dispatch<UserReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    api.getUsers()
      .then((response: AxiosResponse) => {
        dispatch(loadUserAction(response.data.users));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}


export type UserReduxAction = IIsLoading | ILoadUsers;
