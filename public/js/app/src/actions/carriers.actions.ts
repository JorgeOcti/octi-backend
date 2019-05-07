import {
  AxiosError,
  AxiosResponse,
  CancelTokenSource,
  default as Axios
} from 'axios';
import {
  Dispatch
} from 'redux';
import * as swal from 'sweetalert';
import {
  IBaseCarrier,
  ICarrier
} from '../../../../../src/interfaces/carrier.interface';
import ApiService from '../utils/axios';
import {showModal, statusFooterButttonsModal} from '../utils/common';

export interface ICarriersState {
  carriers: ICarrier[];
  loading: boolean;
  source: CancelTokenSource | null;
  tempCarrier: IBaseCarrier;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/CARRIERS/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/CARRIERS/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/CARRIERS/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/CARRIERS/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/CARRIERS/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/CARRIERS/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface IChangeTempCarrier {
  type: '/CARRIERS/CHANGE_TEMP_CARRIER';
  payload: {
    carrier: IBaseCarrier;
  };
  meta: {
    debounce: {
      time: number
    }
  };
}

export function changeTempCarrierAction(carrier: IBaseCarrier, delay?: boolean): IChangeTempCarrier {
  return {
    type: '/CARRIERS/CHANGE_TEMP_CARRIER',
    payload: {
      carrier
    },
    meta: {
      debounce: {
        time: delay ? 300 : 0
      }
    }
  };
}

interface ILoadCarriers {
  type: '/CARRIERS/LOAD_CARRIERS';
  payload: {
    carriers: any;
    count: number;
    pages: number
  };
}

export function loadCarriersAction(carriers: any, count: number, pages: number): ILoadCarriers {
  return {
    type: '/CARRIERS/LOAD_CARRIERS',
    payload: {
      carriers,
      count,
      pages
    }
  };
}

export function getCarriersAction(nextPage: number) {
  return (dispatch: Dispatch<CarrierReduxAction>, getState: () => { carriers: ICarriersState }) => {
    const api: ApiService = new ApiService();
    const state = getState();

    if (nextPage && nextPage !== state.carriers.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.carriers.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getCarriers(page)
      .then((response: AxiosResponse) => {
        dispatch(loadCarriersAction(response.data.results, response.data.count, response.data.pages));
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

export function createCarrierAction() {
  return (dispatch: Dispatch<CarrierReduxAction>, getState: () => {carriers: ICarriersState}) => {
    dispatch(isLoadingAction(true));
    const state = getState();
    const {tempCarrier} = state.carriers;
    const api: ApiService = new ApiService();
    api.createCarrier(tempCarrier)
      .then((response: AxiosResponse) => {
        dispatch(getCarriersAction(state.carriers.pagination.page) as any);
        statusFooterButttonsModal(false);
        showModal(false);
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

export function updateCarrierAction() {
  return (dispatch: Dispatch<CarrierReduxAction>, getState: () => {carriers: ICarriersState}) => {
    const state = getState();
    const {tempCarrier} = state.carriers;
    const $carrier = $(`#carrier-${tempCarrier._id}`);
    const api: ApiService = new ApiService();
    api.updateCarrier(tempCarrier)
      .then((response: AxiosResponse) => {
        $carrier.addClass('editing-item');
        dispatch(getCarriersAction(state.carriers.pagination.page) as any);
        statusFooterButttonsModal(false);
        showModal(false);
        swal(response.data.message, {
          icon: 'success'
        });
        setTimeout(() => {
          $carrier.removeClass('editing-item');
        }, 1000);
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);

        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function deleteCarrierAction(id: string) {
  return (dispatch: Dispatch<CarrierReduxAction>, getState: () => {carriers: ICarriersState}) => {
    const state = getState();
    const api: ApiService = new ApiService();
    api.deleteCarrier(id)
      .then((response: AxiosResponse): void => {
        // effect when removing user
        swal(response.data.message, {
          icon: 'success'
        });
        $(`#carrier-${id}`).addClass('deleted-item');
        setTimeout(() => {
          dispatch(getCarriersAction(state.carriers.pagination.page) as any);
        }, 500);
      })
      .catch((err: AxiosError): void => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type CarrierReduxAction =
  ICancelRequest |
  IIsLoading |
  IChangeTempCarrier |
  ILoadCarriers |
  IChangePage;
