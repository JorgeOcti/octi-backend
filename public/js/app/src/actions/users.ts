import {
  default as Axios,
  AxiosError,
  AxiosResponse,
  CancelTokenSource
} from "axios";
import {Dispatch} from "redux";
import ApiService from "../utils/axios";
import {IUser} from "../../../../../src/interfaces/user.interface";
import {
  showModal,
  statusFooterButttonsModal
} from "../utils/common";
import {IVenue} from "../../../../../src/interfaces/venue.interface";

export interface IUsersState {
  users: IUser[];
  venues: IVenue[];
  loading: boolean;
  tempUser: ITempUser,
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
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

interface IIsLoading {
  type: '/USERS/IS_LOADING';
  payload:{
    loading: boolean;
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

export interface ITempUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  venue?: string;
}

interface IChangeTempUser {
  type: '/USERS/CHANGE_TEMP_USER';
  payload: {
    user: ITempUser;
  },
  meta: {
    debounce: {
      time: number
    }
  }
}

export function changeTempUserAction(user: ITempUser): IChangeTempUser {
  return {
    type: '/USERS/CHANGE_TEMP_USER',
    payload: {
      user
    },
    meta: {
      debounce: {
        time: 100
      }
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

interface IChangeUser {
  type: '/USERS/CHANGE_USER';
  payload: {
    user: IUser;
  }
}

export function changeUserAction(user: IUser): IChangeUser {
  return {
    type: '/USERS/CHANGE_USER',
    payload: {
      user
    }
  }
}

export function editUserAction() {
  return (dispatch: Dispatch<UserReduxAction>, getState: () => {users: IUsersState}) => {
    // dispatch(isLoadingAction(true));
    const state = getState();
    const {tempUser} = state.users;
    const api: ApiService = new ApiService();
    api.editUser(tempUser)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(changeUserAction(response.data.user));
        $(`#user-${tempUser._id}`).addClass('editing-item');
        swal(response.data.message, {
          icon: "success"
        });
        setTimeout(() => {
          $(`#user-${tempUser._id}`).removeClass('editing-item');
        }, 2000)
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        $(`#user-${tempUser._id}`).removeClass('editing-item');
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function addUserAction() {
  return (dispatch: Dispatch<UserReduxAction>, getState: () => {users: IUsersState}) => {
    dispatch(isLoadingAction(true));
    const state = getState();
    const {tempUser} = state.users;
    const api: ApiService = new ApiService();
    api.addUser(tempUser)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(getUsersAction(1) as any);
        swal(response.data.message, {
          icon: "success"
        });
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);

        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

interface ILoadVenuesUser {
  type: '/USERS/LOAD_VENUES';
  payload: {
    venues: IVenue[];
  }
}

export function loadVenuesUserAction(venues: IVenue[]): ILoadVenuesUser {
  return {
    type: '/USERS/LOAD_VENUES',
    payload: {
      venues
    }
  }
}

export function getUsersAction(nextPage?: number) {
  return (dispatch: Dispatch<UserReduxAction>, getState: () => {users: IUsersState}) => {
    const api: ApiService = new ApiService();
    const state = getState();
    // get venues only are empty
    if(!state.users.venues.length){
      api.getVenues()
        .then((response: AxiosResponse) => {
          dispatch(loadVenuesUserAction(response.data.results));
        })
        .catch((err: AxiosError) => {
          api.errorHandler(err);
        });
    }
    dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.users.pagination.page;
    if(nextPage){
      dispatch(changePageAction(nextPage));
    }
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
    api.deleteUser(id)
      .then((response: AxiosResponse) => {
        // effect when removing user
        swal(response.data.message, {
          icon: "success"
        });
        $(`#user-${id}`)
          .addClass('deleted-item');
        setTimeout(() => {
          dispatch(removeUserAction(id));
        }, 500);
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          dispatch(isLoadingAction(true));
        } else {
          dispatch(isLoadingAction(false));
          api.errorHandler(err);
        }
      });
  }
}


export type UserReduxAction = IIsLoading | ILoadUsers | IChangePage | IDeleteUser | ICancelRequest | IChangeTempUser | IChangeUser | ILoadVenuesUser;
