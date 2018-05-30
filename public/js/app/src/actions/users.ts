import {default as Axios, AxiosError, AxiosResponse, CancelTokenSource} from "axios";
import {Dispatch} from "redux";
import ApiService from "../utils/axios";

export interface IUsersState {
  users: any;
  loading: boolean;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  }
}

interface IIsLoading {
  type: '/USERS/IS_LOADING';
  payload:{
    loading: boolean;
  }
}

interface ICancelRequest {
  type: '/USERS/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  }
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/USERS/CANCEL_REQUEST',
    payload: {
      source,
    }
  }
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/USERS/IS_LOADING',
    payload: {
      loading
    }
  }
}

interface IChangePage {
  type: '/USERS/CHANGE_PAGE';
  payload:{
    page: number;
  }
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/USERS/CHANGE_PAGE',
    payload: {
      page
    }
  }
}

interface ILoadUsers {
  type: '/USERS/LOAD_USERS';
  payload: {
    users: any;
    count: number;
    pages: number
  }
}

export function loadUserAction(users: any, count:number, pages: number): ILoadUsers {
  return {
    type: '/USERS/LOAD_USERS',
    payload: {
      users,
      count,
      pages
    }
  }
}

export function getUsersAction(nextPage?: number) {
  return (dispatch: Dispatch<UserReduxAction>, getState: () => {users: IUsersState}) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    const state = getState();
    const page = nextPage ? nextPage : state.users.pagination.page;
    if(nextPage){
      dispatch(changePageAction(nextPage));
    }
    dispatch(isLoadingAction(true));
    api.getUsers(page)
      .then((response: AxiosResponse) => {
        dispatch(loadUserAction(response.data.results, response.data.count, response.data.pages));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

interface IDeleteUser {
  type: '/USERS/DELETE_USER';
  payload: {
    id: string;
  }
}

export function removeUserAction(id: string): IDeleteUser {
  return {
    type: '/USERS/DELETE_USER',
    payload: {
      id,
    }
  }
}

export function deleteUserAction(id: string) {
  return (dispatch: Dispatch<UserReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    api.deleteUser(id)
      .then((response: AxiosResponse) => {
        dispatch(removeUserAction(id));
        swal(response.data.message, {
          icon: "success"
        });
        console.log(response.data)
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          dispatch(isLoadingAction(true));
        } else {
          dispatch(isLoadingAction(false));
        }
      });
  }
}


export type UserReduxAction = IIsLoading | ILoadUsers | IChangePage | IDeleteUser | ICancelRequest;
