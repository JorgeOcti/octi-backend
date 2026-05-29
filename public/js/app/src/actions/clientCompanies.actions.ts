import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {IBaseCompany} from '../../../../../src/app/interfaces/company.interface';
import ApiService from '../utils/axios';
import {showModal, statusFooterButttonsModal} from '../utils/common';

export interface IClientCompaniesState {
  companies: IBaseCompany[];
  tempCompany: IBaseCompany;
  loading: boolean;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/CLIENT_COMPANIES/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/CLIENT_COMPANIES/CANCEL_REQUEST',
    payload: { source }
  };
}

interface IIsLoading {
  type: '/CLIENT_COMPANIES/IS_LOADING';
  payload: { loading: boolean };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/CLIENT_COMPANIES/IS_LOADING',
    payload: { loading }
  };
}

interface IChangePage {
  type: '/CLIENT_COMPANIES/CHANGE_PAGE';
  payload: { page: number };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/CLIENT_COMPANIES/CHANGE_PAGE',
    payload: { page }
  };
}

interface IChangeTempCompany {
  type: '/CLIENT_COMPANIES/CHANGE_TEMP_COMPANY';
  payload: { company: IBaseCompany };
  meta: { debounce: { time: number } };
}

export function changeTempClientCompanyAction(company: IBaseCompany): IChangeTempCompany {
  return {
    type: '/CLIENT_COMPANIES/CHANGE_TEMP_COMPANY',
    payload: { company },
    meta: { debounce: { time: 300 } }
  };
}

interface ILoadCompanies {
  type: '/CLIENT_COMPANIES/LOAD_COMPANIES';
  payload: { companies: any; count: number; pages: number };
}

export function loadClientCompaniesAction(companies: any, count: number, pages: number): ILoadCompanies {
  return {
    type: '/CLIENT_COMPANIES/LOAD_COMPANIES',
    payload: { companies, count, pages }
  };
}

export function getClientCompaniesAction(nextPage: number) {
  return (dispatch: Dispatch<ClientCompaniesReduxAction>, getState: () => { clientCompanies: IClientCompaniesState }) => {
    const api: ApiService = new ApiService();
    const state = getState();

    if (nextPage && nextPage !== state.clientCompanies.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.clientCompanies.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getClientCompanies(page)
      .then((response: AxiosResponse) => {
        dispatch(loadClientCompaniesAction(response.data.results, response.data.count, response.data.pages));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        if (Axios.isCancel(err)) {
          dispatch(isLoadingAction(true));
        } else {
          dispatch(isLoadingAction(false));
          api.errorHandler(err);
        }
      });
  };
}

interface IChangeCompany {
  type: '/CLIENT_COMPANIES/CHANGE_COMPANY';
  payload: { company: IBaseCompany };
}

export function changeClientCompanyAction(company: IBaseCompany): IChangeCompany {
  return {
    type: '/CLIENT_COMPANIES/CHANGE_COMPANY',
    payload: { company }
  };
}

export function updateClientCompanyAction() {
  return (dispatch: Dispatch<ClientCompaniesReduxAction>, getState: () => { clientCompanies: IClientCompaniesState }) => {
    const state = getState();
    const {tempCompany} = state.clientCompanies;
    statusFooterButttonsModal(true);
    const $company = $(`#client-company-${tempCompany._id}`);
    const api: ApiService = new ApiService();
    api.updateClientCompany(tempCompany)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(changeClientCompanyAction(response.data.company));
        $company.addClass('editing-item');
        swal(response.data.message, { icon: 'success' });
        setTimeout(() => {
          $company.removeClass('editing-item');
        }, 1000);
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        $company.removeClass('editing-item');
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type ClientCompaniesReduxAction =
  ICancelRequest |
  IIsLoading |
  IChangePage |
  ILoadCompanies |
  IChangeTempCompany |
  IChangeCompany;
