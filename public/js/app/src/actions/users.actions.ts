import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {ICompany} from '../../../../../src/interfaces/company.interface';
import {IForm} from '../../../../../src/interfaces/form.interface';
import {IPermission} from '../../../../../src/interfaces/permision.interface';
import {IUser} from '../../../../../src/interfaces/user.interface';
import {IVenue} from '../../../../../src/interfaces/venue.interface';
import ApiService from '../utils/axios';
import {showModal, statusFooterButttonsModal} from '../utils/common';

export interface IUsersState {
  users: IUser[];
  venues: IVenue[];
  forms: IForm[];
  companies: ICompany[];
  permissions: IPermission[];
  loading: boolean;
  tempUser: ITempUser;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/USERS/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/USERS/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/USERS/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/USERS/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/USERS/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/USERS/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

export interface ITempUser {
  _id?: string;
  firstName?: string;
  password?: string;
  lastName?: string;
  email?: string;
  venue?: string | null;
  venuesAccess: IVenue[];
  userForms: IForm[];
  preferred?: string | null;
  userPermissions: IPermission[];
  company: ICompany | null;
}

interface IChangeTempUser {
  type: '/USERS/CHANGE_TEMP_USER';
  payload: {
    user: ITempUser;
  };
  meta: {
    debounce: {
      time: number
    }
  };
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
  };
}

interface ILoadUsers {
  type: '/USERS/LOAD_USERS';
  payload: {
    users: any;
    count: number;
    pages: number
  };
}

export function loadUserAction(users: any, count: number, pages: number): ILoadUsers {
  return {
    type: '/USERS/LOAD_USERS',
    payload: {
      users,
      count,
      pages
    }
  };
}

interface IChangeUser {
  type: '/USERS/CHANGE_USER';
  payload: {
    user: IUser;
  };
}

export function changeUserAction(user: IUser): IChangeUser {
  return {
    type: '/USERS/CHANGE_USER',
    payload: {
      user
    }
  };
}

export function updateUserAction() {
  return (dispatch: Dispatch<UserReduxAction>, getState: () => {users: IUsersState}) => {
    // dispatch(isLoadingAction(true));
    const state = getState();
    const {tempUser} = state.users;
    const api: ApiService = new ApiService();
    api.updteUser(tempUser)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(changeUserAction(response.data.user));
        $(`#user-${tempUser._id}`).addClass('editing-item');
        swal(response.data.message, {
          icon: 'success'
        });
        setTimeout(() => {
          $(`#user-${tempUser._id}`).removeClass('editing-item');
        }, 1000);
        dispatch(getUsersAction(1) as any);
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        $(`#user-${tempUser._id}`).removeClass('editing-item');
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function createUserAction() {
  return (dispatch: Dispatch<UserReduxAction>, getState: () => {users: IUsersState}) => {
    dispatch(isLoadingAction(true));
    const state = getState();
    const {tempUser} = state.users;
    const api: ApiService = new ApiService();
    api.createUser(tempUser)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(getUsersAction(1) as any);
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

interface ILoadVenuesUser {
  type: '/USERS/LOAD_VENUES';
  payload: {
    venues: IVenue[];
  };
}

export function loadVenuesUserAction(venues: IVenue[]): ILoadVenuesUser {
  return {
    type: '/USERS/LOAD_VENUES',
    payload: {
      venues
    }
  };
}

interface ILoadPermissionsUser {
  type: '/USERS/LOAD_PERMISSIONS';
  payload: {
    permissions: IPermission[];
  };
}

export function loadPermissionsUserAction(permissions: IPermission[]): ILoadPermissionsUser {
  return {
    type: '/USERS/LOAD_PERMISSIONS',
    payload: {
      permissions
    }
  };
}

interface ILoadFormsUser {
  type: '/USERS/LOAD_FORMS';
  payload: {
    forms: IForm[];
  };
}

export function loadFormsUserAction(forms: IForm[]): ILoadFormsUser {
  return {
    type: '/USERS/LOAD_FORMS',
    payload: {
      forms
    }
  };
}

interface ILoadCompaniesUser {
  type: '/USERS/LOAD_COMPANIES';
  payload: {
    companies: ICompany[];
  };
}

export function loadCompaniesUserAction(companies: ICompany[]): ILoadCompaniesUser {
  return {
    type: '/USERS/LOAD_COMPANIES',
    payload: {
      companies
    }
  };
}

export function getUsersAction(nextPage: number, search?: string) {
  return (dispatch: Dispatch<UserReduxAction>, getState: () => {users: IUsersState}) => {
    const api: ApiService = new ApiService();
    const state = getState();

    if (nextPage && nextPage !== state.users.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    // get venues and permissions
    if (!search) {
      Axios.all([
        api.getCompanies(1, 200),
        api.getVenues(1, 200),
        api.getPermissions(1, 200),
        api.getForms(1, 200)
      ])
        .then(Axios.spread((companies, venues, permissions, forms) => {
          dispatch(loadCompaniesUserAction(companies.data.results));
          dispatch(loadVenuesUserAction(venues.data.results));
          dispatch(loadPermissionsUserAction(permissions.data.results));
          dispatch(loadFormsUserAction(forms.data.results));
        }))
        .catch((err: AxiosError): void => {
          api.errorHandler(err);
        });
    }

    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.users.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getUsers(page, search)
      .then((response: AxiosResponse): void => {
        dispatch(loadUserAction(response.data.results, response.data.count, response.data.pages));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError): void => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          dispatch(isLoadingAction(true));
        } else {
          dispatch(isLoadingAction(false));
          api.errorHandler(err);
        }
      });
  };
}

interface IDeleteUser {
  type: '/USERS/DELETE_USER';
  payload: {
    id: string;
  };
}

export function removeUserAction(id: string): IDeleteUser {
  return {
    type: '/USERS/DELETE_USER',
    payload: {
      id
    }
  };
}

export function deleteUserAction(id: string) {
  return (dispatch: Dispatch<UserReduxAction>) => {
    const api: ApiService = new ApiService();
    api.deleteUser(id)
      .then((response: AxiosResponse): void => {
        swal(response.data.message, {
          icon: 'success'
        });
        // effect when removing user
        $(`#user-${id}`)
          .addClass('deleted-item');
        setTimeout(() => {
          dispatch(removeUserAction(id));
        }, 1000);
      })
      .catch((err: AxiosError): void => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type UserReduxAction = IIsLoading | ILoadUsers | IChangePage | IDeleteUser | ICancelRequest | IChangeTempUser | IChangeUser | ILoadVenuesUser | ILoadPermissionsUser | ILoadFormsUser |ILoadCompaniesUser;
