import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import {ICar} from '../../../../../src/app/interfaces/car.interface';
import {IBrand} from '../../../../../src/app/interfaces/brand.interface';
import ApiService from '../utils/axios';

export interface ICarsState {
  cars: ICar[];
  car: ICar | null;
  carEvents: any;
  brands: IBrand[];
  loading: boolean;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/CARS/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/CARS/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/CARS/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/CARS/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/CARS/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/CARS/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface ILoadCars {
  type: '/CARS/LOAD_CARS';
  payload: {
    cars: any;
    count: number;
    pages: number
  };
}

export function loadCarsAction(cars: any, count: number, pages: number): ILoadCars {
  return {
    type: '/CARS/LOAD_CARS',
    payload: {
      cars,
      count,
      pages
    }
  };
}

interface ILoadBrands {
  type: '/CARS/LOAD_BRANDS';
  payload: {
    brands: IBrand[];
  };
}

export function loadBrandsAction(brands: any): ILoadBrands {
  return {
    type: '/CARS/LOAD_BRANDS',
    payload: {
      brands: brands,
    }
  }
}

interface ILoadCar {
  type: '/CARS/LOAD_CAR';
  payload: {
    car: ICar;
  };
}

export function loadCarAction(car: ICar): ILoadCar {
  return {
    type: '/CARS/LOAD_CAR',
    payload: {
      car
    }
  };
}

export function getCarAction(id: string) {
  return (dispatch: Dispatch<CarReduxAction>/*, getState: () => {cars: ICarsState}*/) => {
    const api: ApiService = new ApiService();
    // const state = getState();
    dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    api.getCar(id)
      .then((response: AxiosResponse) => {
        document.title = ` ${response.data.data.vin} - Detalle  | OSA Andes`;
        dispatch(loadCarAction(response.data.data));
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

export function getCarsAction(nextPage: number, search?: string) {
  return (dispatch: Dispatch<CarReduxAction>, getState: () => {cars: ICarsState}) => {
    const api: ApiService = new ApiService();
    const state = getState();
    if (nextPage && nextPage !== state.cars.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.cars.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }

    if (state.cars.brands.length === 0) {
      api.getBrands({page: 1, pageSize: 500})
        .then((response: AxiosResponse) => {
          dispatch(loadBrandsAction(response.data.results));
        })
        .catch((err: AxiosError) => {
          api.errorHandler(err);
        });
    }

    api.getAdminCars(page, search)
      .then((response: AxiosResponse) => {
        dispatch(loadCarsAction(response.data.results, response.data.count, response.data.pages));
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

export type CarReduxAction =
  ICancelRequest |
  IIsLoading |
  IChangePage |
  ILoadCars |
  ILoadBrands |
  ILoadCar;
