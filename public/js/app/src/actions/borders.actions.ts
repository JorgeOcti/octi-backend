import {IBaseBorder, IBorder} from "../../../../../src/app/interfaces/border.interface";
import {ICompany} from "../../../../../src/app/interfaces/company.interface";
import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from "axios";
import {Dispatch} from "redux";
import ApiService from "../utils/axios";
import {showModal, statusFooterButttonsModal} from "../utils/common";
import * as swal from 'sweetalert';
import {processDeleteVenueAction} from "./venues.actions";

export interface IBorderState {
  borders: IBorder[];
  tempBorder: IBaseBorder;
  companies: ICompany[];
  loading: boolean;
  source: CancelTokenSource | null;
  searchText: string;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/BORDERS/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  }
}
export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/BORDERS/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/BORDERS/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/BORDERS/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/BORDERS/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/BORDERS/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface IChangeSearchBorder {
  type: '/BORDERS/CHANGE_SEARCH';
  payload: {
    searchText: string;
  };
}

export function changeSearchAction(searchText: string): IChangeSearchBorder {
  return {
    type: '/BORDERS/CHANGE_SEARCH',
    payload: {
      searchText
    }
  };
}

interface IChangeTempBorder {
  type: '/BORDERS/CHANGE_TEMP_BORDER';
  payload: {
    border: IBaseBorder;
  };
}

export function changeTempBorderAction(border: IBaseBorder): IChangeTempBorder {
  return {
    type: '/BORDERS/CHANGE_TEMP_BORDER',
    payload: {
      border
    }
  };
}

interface ILoadBorders {
  type: '/BORDERS/LOAD_BORDERS';
  payload: {
    borders: any;
    count: number;
    pages: number
  };
}

export function loadBorderAction(borders: any, count: number, pages: number): ILoadBorders {
  return {
    type: '/BORDERS/LOAD_BORDERS',
    payload: {
      borders,
      count,
      pages
    }
  };
}

interface ILoadCompaniesBorder {
  type: '/BORDERS/LOAD_COMPANIES';
  payload: {
    companies: ICompany[];
  };
}

export function loadCompaniesBorderAction(companies: ICompany[]): ILoadCompaniesBorder {
  return {
    type: '/BORDERS/LOAD_COMPANIES',
    payload: {
      companies
    }
  };
}



export function getBorderCompanyAction() {
  return (dispatch: Dispatch<BorderReduxAction>, getState: () => { border: IBorderState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    api.getCompanies(1, 200)
      .then((companies: AxiosResponse) => {
        dispatch(loadCompaniesBorderAction(companies.data.results));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError): void => {
        api.errorHandler(err);
      });
  };
}

export function getBorderAction(nextPage: number) {
  return (dispatch: Dispatch<BorderReduxAction>, getState: () => { border: IBorderState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    const { searchText } = state.border;
    if (nextPage && nextPage !== state.border.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.border.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getBorders(page, 20, searchText)
      .then((response: AxiosResponse) => {
        dispatch(loadBorderAction(response.data.results, response.data.count, response.data.pages));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError): void => {
        api.errorHandler(err);
      });
  };
}


export function createBorderAction() {
  return (dispatch: Dispatch<BorderReduxAction>, getState: () => { border: IBorderState }) => {
    dispatch(isLoadingAction(true));
    const state = getState();
    const { tempBorder } = state.border;
    const api: ApiService = new ApiService();
    api.createBorder(tempBorder)
      .then((response: AxiosResponse) => {
        dispatch(getBorderAction(state.border.pagination.page) as any);
        statusFooterButttonsModal(false);
        showModal(false);
        swal!(response.data.message, {
          icon: 'success'
        });
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function updateBorderAction() {
  return (dispatch: Dispatch<BorderReduxAction>, getState: () => { border: IBorderState }) => {
    const state = getState();
    const { tempBorder } = state.border;
    const $border = $(`#border-${tempBorder._id}`);
    const api: ApiService = new ApiService();
    api.updateBorder(tempBorder)
      .then((response: AxiosResponse) => {
        dispatch(getBorderAction(state.border.pagination.page) as any);
        statusFooterButttonsModal(false);
        showModal(false);
        $border.addClass('editing-item');
        swal!(response.data.message, {
          icon: 'success'
        });
        setTimeout(() => {
          $border.removeClass('editing-item');
        }, 1000);
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        $border.removeClass('editing-item');
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

interface IDeleteBorder {
  type: '/BORDERS/DELETE_BORDER';
  payload: {
    id: string;
  };
}

export function processDeleteBorderAction(id: string): IDeleteBorder {
  return {
    type: '/BORDERS/DELETE_BORDER',
    payload: {
      id
    }
  };
}

export function deleteBorderAction(id: string) {
  return (dispatch: Dispatch<BorderReduxAction>, getState: () => { border: IBorderState }) => {
    const state = getState();
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    api.deleteBorder(id)
      .then((response: AxiosResponse): void => {
        // effect when removing user
        swal!(response.data.message, {
          icon: 'success'
        });
        $(`#border-${id}`)
          .addClass('deleted-item');
        setTimeout(() => {
          dispatch(processDeleteBorderAction(id));
          dispatch(isLoadingAction(false));
        }, 500);
      })
      .catch((err: AxiosError): void => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type BorderReduxAction =
  ICancelRequest |
  IIsLoading |
  IChangePage |
  ILoadBorders |
  IChangeSearchBorder |
  IChangeTempBorder |
  IDeleteBorder |
  ILoadCompaniesBorder;

