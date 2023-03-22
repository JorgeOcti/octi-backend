import {
  AxiosError,
  AxiosResponse,
  CancelTokenSource,
  default as Axios
} from 'axios';
import { Dispatch } from 'redux';
import * as swal from 'sweetalert';
import { ICompany } from '../../../../../src/app/interfaces/company.interface';
import { IForm } from '../../../../../src/form/interfaces/form.interface';
import { IPermission } from '../../../../../src/billing/interfaces/permission.interface';
import { IUser } from '../../../../../src/app/interfaces/user.interface';
import { IVenue } from '../../../../../src/app/interfaces/venue.interface';
import ApiService from '../utils/axios';
import { showModal, statusFooterButttonsModal } from '../utils/common';
import { ISalesChannel } from '../../../../../src/request/interfaces/salesChannel.interface';
import { UserTypes } from '../../../../../src/app/models/user.model.types';

export interface IUsersState {
  users: IUser[];
  venues: IVenue[];
  companies: ICompany[];
  forms: IForm[];
  channels: ISalesChannel[];
  permissions: IPermission[];
  loading: boolean;
  tempUser: ITempUser;
  source: CancelTokenSource | null;
  searchText: string;
  filters: {
    venues: string[];
  };
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

interface IFilterVenues {
  type: '/USERS/FILTER_VENUES';
  payload: {
    venues: string[];
  };
}

export function filterVenuesAction(venues: string[]): IFilterVenues {
  return {
    type: '/USERS/FILTER_VENUES',
    payload: {
      venues
    }
  };
}

export function changeStatusUserAction(user: IUser) {
  return (
    dispatch: Dispatch<UserReduxAction>,
    getState: () => { users: IUsersState }
  ) => {
    const state = getState();
    const api: ApiService = new ApiService();
    api
      .changeStatusUser(user._id, !user.active)
      .then((response: AxiosResponse) => {
        const $user = $(`#user-${user._id}`);
        $user.addClass('editing-item');
        dispatch(
          getUsersAction(state.users.pagination.page, UserTypes.common) as any
        );
        setTimeout(() => {
          $user.removeClass('editing-item');
        }, 1000);
        // swal!(response.data.message, {
        //   icon: 'success'
        // });
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
  companiesAccess: ICompany[];
  userForms: IForm[];
  settings: Dictionary<any>;
  isAdmin: boolean;
  isDriver: boolean;
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
      time: number;
    };
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
    pages: number;
  };
}

export function loadUserAction(
  users: any,
  count: number,
  pages: number
): ILoadUsers {
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

export function createUserAction() {
  return (
    dispatch: Dispatch<UserReduxAction>,
    getState: () => { users: IUsersState }
  ) => {
    dispatch(isLoadingAction(true));
    const state = getState();
    const { tempUser } = state.users;
    const api: ApiService = new ApiService();
    api
      .createUser(tempUser)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(getUsersAction(1, UserTypes.common) as any);
        swal!(response.data.message, {
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

export function updateUserAction() {
  return (
    dispatch: Dispatch<UserReduxAction>,
    getState: () => { users: IUsersState }
  ) => {
    // dispatch(isLoadingAction(true));
    const state = getState();
    const { tempUser } = state.users;
    const api: ApiService = new ApiService();
    api
      .updateUser(tempUser)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(changeUserAction(response.data.user));
        $(`#user-${tempUser._id}`).addClass('editing-item');
        swal!(response.data.message, {
          icon: 'success'
        });
        setTimeout(() => {
          $(`#user-${tempUser._id}`).removeClass('editing-item');
        }, 1000);
        dispatch(
          getUsersAction(state.users.pagination.page, UserTypes.common) as any
        );
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        $(`#user-${tempUser._id}`).removeClass('editing-item');
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function createIntegrationAction(user: any) {
  return (
    dispatch: Dispatch<UserReduxAction>,
    getState: () => { users: IUsersState }
  ) => {
    dispatch(isLoadingAction(true));
    const api: ApiService = new ApiService();
    api
      .createIntegration(user)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(getUsersAction(1, UserTypes.integration) as any);
        swal!(response.data.message, {
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

export function updateIntegrationAction(user: any) {
  return (
    dispatch: Dispatch<UserReduxAction>,
    getState: () => { users: IUsersState }
  ) => {
    // dispatch(isLoadingAction(true));
    const api: ApiService = new ApiService();
    const state = getState();
    api
      .updateIntegration(user)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(changeUserAction(response.data.user));
        $(`#user-${user._id}`).addClass('editing-item');
        swal!(response.data.message, {
          icon: 'success'
        });
        setTimeout(() => {
          $(`#user-${user._id}`).removeClass('editing-item');
        }, 1000);
        dispatch(
          getUsersAction(
            state.users.pagination.page,
            UserTypes.integration
          ) as any
        );
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        $(`#user-${user._id}`).removeClass('editing-item');
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

interface IChangeSearchUser {
  type: '/USERS/CHANGE_SEARCH';
  payload: {
    searchText: string;
  };
}

export function changeSearchUserAction(searchText: string): IChangeSearchUser {
  return {
    type: '/USERS/CHANGE_SEARCH',
    payload: {
      searchText
    }
  };
}

interface ILoadVenuesUser {
  type: '/USERS/LOAD_VENUES';
  payload: {
    venues: IVenue[];
    companies: ICompany[];
  };
}

export function loadVenuesUserAction(venues: IVenue[]): ILoadVenuesUser {
  return {
    type: '/USERS/LOAD_VENUES',
    payload: {
      venues,
      companies: Object.values(
        venues.reduce((acc: any, venue: any) => {
          if (!acc[venue.company._id]) {
            acc[venue.company._id] = {
              _id: venue.company._id,
              name: venue.company.name,
              venues: []
            };
          }
          if (!acc[venue.company._id].venues.includes(venue._id)) {
            acc[venue.company._id].venues.push({
              _id: venue._id,
              name: venue.name
            });
          }
          return acc;
        }, {})
      )
    }
  };
}

interface ILoadPermissionsUser {
  type: '/USERS/LOAD_PERMISSIONS';
  payload: {
    permissions: IPermission[];
  };
}

export function loadPermissionsUserAction(
  permissions: IPermission[]
): ILoadPermissionsUser {
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

export function loadCompaniesUserAction(
  companies: ICompany[]
): ILoadCompaniesUser {
  return {
    type: '/USERS/LOAD_COMPANIES',
    payload: {
      companies
    }
  };
}

interface ILoadChannelsUser {
  type: '/USERS/LOAD_CHANNELS';
  payload: {
    channels: ISalesChannel[];
  };
}

export function loadChannelsUserAction(
  channels: ISalesChannel[]
): ILoadChannelsUser {
  return {
    type: '/USERS/LOAD_CHANNELS',
    payload: {
      channels
    }
  };
}

export function getUsersAction(
  nextPage: number,
  type: UserTypes,
  search?: string
) {
  return (
    dispatch: Dispatch<UserReduxAction>,
    getState: () => { users: IUsersState }
  ) => {
    const api: ApiService = new ApiService();
    const state = getState();

    if (nextPage && nextPage !== state.users.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    // get venues and permissions

    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.users.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    Axios.all([
      api.getUsers({
        page,
        type,
        venue: state.users.filters.venues.length
          ? state.users.filters.venues[0]
          : undefined,
        search: state.users.searchText
      }),
      // api.getCompanies(1, 200),
      api.getVenues({ page: 1, pageSize: 500, noPopulate: false }),
      api.getSalesChannel({ page: 1, pageSize: 200 }),
      api.getPermissions(1, 200),
      api.getForms(1, 200)
    ])
      .then(
        Axios.spread((users, venues, channeles, permissions, forms) => {
          dispatch(
            loadUserAction(
              users.data.results,
              users.data.count,
              users.data.pages
            )
          );
          // dispatch(loadCompaniesUserAction(companies.data.results));
          dispatch(loadVenuesUserAction(venues.data.results));
          dispatch(loadChannelsUserAction(channeles.data.results));
          dispatch(loadPermissionsUserAction(permissions.data.results));
          dispatch(loadFormsUserAction(forms.data.results));
          dispatch(isLoadingAction(false));
        })
      )
      .catch((err: AxiosError): void => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });

    // .then((response: AxiosResponse): void => {
    //   dispatch(loadUserAction(response.data.results, response.data.count, response.data.pages));
    //   dispatch(isLoadingAction(false));
    // })
    // .catch((err: AxiosError): void => {
    //   // if the request is canceled
    //   if (Axios.isCancel(err)) {
    //     dispatch(isLoadingAction(true));
    //   } else {
    //     dispatch(isLoadingAction(false));
    //     api.errorHandler(err);
    //   }
    // });
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
    api
      .deleteUser(id)
      .then((response: AxiosResponse): void => {
        swal!(response.data.message, {
          icon: 'success'
        });
        // effect when removing user
        $(`#user-${id}`).addClass('deleted-item');
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

export function deleteIntegrationAction(id: string) {
  return (dispatch: Dispatch<UserReduxAction>) => {
    const api: ApiService = new ApiService();
    api
      .deleteIntegration(id)
      .then((response: AxiosResponse): void => {
        swal!(response.data.message, {
          icon: 'success'
        });
        // effect when removing user
        $(`#user-${id}`).addClass('deleted-item');
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

export type UserReduxAction =
  | IIsLoading
  | ILoadUsers
  | IFilterVenues
  | IChangePage
  | IDeleteUser
  | IChangeSearchUser
  | ICancelRequest
  | IChangeTempUser
  | ILoadChannelsUser
  | IChangeUser
  | ILoadVenuesUser
  | ILoadPermissionsUser
  | ILoadFormsUser
  | ILoadCompaniesUser;
