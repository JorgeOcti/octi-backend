import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from "axios";
import {
  IPlanning
} from '../../../../../src/planning/interfaces/planning.interface';
import {Dispatch} from "redux";
import ApiService from "../utils/axios";

export interface IPlanningState {
  plannings: IPlanning[];
  loading: boolean;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/PLANNING/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/PLANNING/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/PLANNING/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/PLANNING/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/PLANNING/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/PLANNING/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface ILoadPlanning {
  type: '/PLANNING/LOAD_PLANNING';
  payload: {
    plannings: any;
    count: number;
    pages: number
  };
}

export function loadPlanningAction(plannings: any, count: number, pages: number): ILoadPlanning {
  return {
    type: '/PLANNING/LOAD_PLANNING',
    payload: {
      plannings,
      count,
      pages
    }
  };
}

export function getPlanningAction(nextPage: number) {
  return (dispatch: Dispatch<PlanningReduxAction>, getState: () => {labels: IPlanningState}) => {
    const api: ApiService = new ApiService();
    const state = getState();
    if (nextPage && nextPage !== state.labels.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.labels.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getPlanning(page)
      .then((response: AxiosResponse) => {
        dispatch(loadPlanningAction(response.data.results, response.data.count, response.data.pages));
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

export type PlanningReduxAction =
  ILoadPlanning |
  IChangePage |
  IIsLoading |
  ICancelRequest;
