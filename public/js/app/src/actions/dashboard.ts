import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from "axios";
import ApiService from "../utils/axios";
import {Dispatch} from "redux";
import {ICar} from "../../../../../src/interfaces/car.interface";

export interface IDashboardState {
  loading: boolean;
  source: CancelTokenSource | null;
  cars: any[];
  car: ICar | null;
}

interface IIsLoading {
  type: '/DASHBOARD/IS_LOADING';
  payload:{
    loading: boolean;
  }
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/DASHBOARD/IS_LOADING',
    payload: {
      loading
    }
  }
}

interface ICancelRequest {
  type: '/DASHBOARD/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  }
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/DASHBOARD/CANCEL_REQUEST',
    payload: {
      source,
    }
  }
}

interface ILoadCars {
  type: '/DASHBOARD/LOAD_CARS';
  payload: {
    cars: ICar[];
  }
}

export function loadCarsAction(cars: ICar[]): ILoadCars {
  return {
    type: '/DASHBOARD/LOAD_CARS',
    payload: {
      cars
    }
  }
}

interface ILoadCar {
  type: '/DASHBOARD/LOAD_CAR';
  payload: {
    car: ICar;
  }
}

export function loadCarAction(car: ICar): ILoadCar {
  return {
    type: '/DASHBOARD/LOAD_CAR',
    payload: {
      car
    }
  }
}

export function getCarsAction() {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api.getCars()
      .then((response: AxiosResponse) => {
        dispatch(loadCarsAction(response.data.results));
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

export function getCarAction(id: string) {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api.getCar(id)
      .then((response: AxiosResponse) => {
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

export type DashboardReduxAction = IIsLoading | ICancelRequest | ILoadCars | ILoadCar ;
