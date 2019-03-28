import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import {IBaseCompany, ICompany} from '../../../../../src/interfaces/company.interface';
import ApiService from '../utils/axios';
import {showModal, statusFooterButttonsModal} from '../utils/common';

export interface ICompaniesState {
  companies: ICompany[];
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
  type: '/COMPANIES/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/COMPANIES/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/COMPANIES/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/COMPANIES/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/COMPANIES/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/COMPANIES/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface IChangeTempCompany {
  type: '/COMPANIES/CHANGE_TEMP_COMPANY';
  payload: {
    company: IBaseCompany;
  };
  meta: {
    debounce: {
      time: number
    }
  };
}

export function changeTempCompanyAction(company: IBaseCompany): IChangeTempCompany {
  return {
    type: '/COMPANIES/CHANGE_TEMP_COMPANY',
    payload: {
      company
    },
    meta: {
      debounce: {
        time: 300
      }
    }
  };
}

interface ILoadCompanies {
  type: '/COMPANIES/LOAD_COMPANIES';
  payload: {
    companies: any;
    count: number;
    pages: number
  };
}

export function loadCompaniesAction(companies: any, count: number, pages: number): ILoadCompanies {
  return {
    type: '/COMPANIES/LOAD_COMPANIES',
    payload: {
      companies,
      count,
      pages
    }
  };
}

export function getCompaniesAction(nextPage: number) {
  return (dispatch: Dispatch<CompaniesReduxAction>, getState: () => {companies: ICompaniesState}) => {
    const api: ApiService = new ApiService();
    const state = getState();

    if (nextPage && nextPage !== state.companies.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.companies.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getCompanies(page)
      .then((response: AxiosResponse) => {
        dispatch(loadCompaniesAction(response.data.results, response.data.count, response.data.pages));
        dispatch(isLoadingAction(false));
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

export function createCompanyAction() {
  return (dispatch: Dispatch<CompaniesReduxAction>, getState: () => {companies: ICompaniesState}) => {
    const state = getState();
    const {tempCompany} = state.companies;
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    statusFooterButttonsModal(true);
    api.createCompany(tempCompany)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(getCompaniesAction(1) as any);
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

interface IChangeCompany {
  type: '/COMPANIES/CHANGE_COMPANY';
  payload: {
    company: IBaseCompany;
  };
}

export function changeCompanyAction(company: IBaseCompany): IChangeCompany {
  return {
    type: '/COMPANIES/CHANGE_COMPANY',
    payload: {
      company
    }
  };
}

export function updateCompanyAction() {
  return (dispatch: Dispatch<CompaniesReduxAction>, getState: () => {companies: ICompaniesState}) => {
    const state = getState();
    const {tempCompany} = state.companies;
    statusFooterButttonsModal(true);
    const $company = $(`#company-${tempCompany._id}`);
    const api: ApiService = new ApiService();
    api.updateCompany(tempCompany)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(changeCompanyAction(response.data.company));
        $company.addClass('editing-item');
        swal(response.data.message, {
          icon: 'success'
        });
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

interface IDeleteCompany {
  type: '/COMPANIES/DELETE_COMPANY';
  payload: {
    id: string;
  };
}

export function processDeleteCompanyAction(id: string): IDeleteCompany {
  return {
    type: '/COMPANIES/DELETE_COMPANY',
    payload: {
      id
    }
  };
}

export function deleteCompanyAction(id: string) {
  return (dispatch: Dispatch<CompaniesReduxAction>) => {
    const api: ApiService = new ApiService();
    api.deleteCompany(id)
      .then((response: AxiosResponse): void => {
        // effect when removing user
        swal(response.data.message, {
          icon: 'success'
        });
        $(`#company-${id}`)
          .addClass('deleted-item');
        setTimeout(() => {
          dispatch(processDeleteCompanyAction(id));
        }, 500);
      })
      .catch((err: AxiosError): void => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type CompaniesReduxAction = ICancelRequest | IIsLoading | IChangePage | ILoadCompanies | IChangeTempCompany | IChangeCompany |IDeleteCompany;
