import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import {IBaseCompany, ICompany} from '../../../../../src/interfaces/company.interface';
import ApiService from '../utils/axios';

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
  return (dispatch: Dispatch<CompaniesReduxAction>, getState: () => {venues: ICompaniesState}) => {
    const api: ApiService = new ApiService();
    const state = getState();

    dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.venues.pagination.page;
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

export type CompaniesReduxAction = ICancelRequest | IIsLoading | IChangePage | ILoadCompanies | IChangeTempCompany;
