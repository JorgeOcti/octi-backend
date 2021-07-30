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
  IBaseRegion,
  IRegion
} from '../../../../../src/app/interfaces/region.interface';
import ApiService from '../utils/axios';
import {showModal, statusFooterButttonsModal} from '../utils/common';

export interface IRegionsState {
  regions: IRegion[];
  loading: boolean;
  source: CancelTokenSource | null;
  tempRegion: IBaseRegion;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/REGIONS/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/REGIONS/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/REGIONS/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/REGIONS/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/REGIONS/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/REGIONS/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface IChangeTempRegion {
  type: '/REGIONS/CHANGE_TEMP_REGION';
  payload: {
    region: IBaseRegion;
  };
  meta: {
    debounce: {
      time: number
    }
  };
}

export function changeTempRegionAction(region: IBaseRegion, delay?: boolean): IChangeTempRegion {
  return {
    type: '/REGIONS/CHANGE_TEMP_REGION',
    payload: {
      region
    },
    meta: {
      debounce: {
        time: delay ? 300 : 0
      }
    }
  };
}

interface ILoadRegion {
  type: '/REGIONS/LOAD_REGIONS';
  payload: {
    regions: any;
    count: number;
    pages: number
  };
}

export function loadRegionsAction(regions: any, count: number, pages: number): ILoadRegion {
  return {
    type: '/REGIONS/LOAD_REGIONS',
    payload: {
      regions,
      count,
      pages
    }
  };
}

export function getRegionsAction(nextPage: number) {
  return (dispatch: Dispatch<RegionReduxAction>, getState: () => { regions: IRegionsState }) => {
    const api: ApiService = new ApiService();
    const state = getState();

    if (nextPage && nextPage !== state.regions.pagination.page) {
      dispatch(isLoadingAction(true));
    }
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.regions.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getRegions(page)
      .then((response: AxiosResponse) => {
        dispatch(loadRegionsAction(response.data.results, response.data.count, response.data.pages));
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

export function createRegionAction() {
  return (dispatch: Dispatch<RegionReduxAction>, getState: () => {regions: IRegionsState}) => {
    dispatch(isLoadingAction(true));
    const state = getState();
    const {tempRegion} = state.regions;
    const api: ApiService = new ApiService();
    api.createRegion(tempRegion)
      .then((response: AxiosResponse) => {
        dispatch(getRegionsAction(state.regions.pagination.page) as any);
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

export function updateRegionAction() {
  return (dispatch: Dispatch<RegionReduxAction>, getState: () => {regions: IRegionsState}) => {
    const state = getState();
    const {tempRegion} = state.regions;
    const $region = $(`#region-${tempRegion._id}`);
    const api: ApiService = new ApiService();
    api.updateRegion(tempRegion)
      .then((response: AxiosResponse) => {
        $region.addClass('editing-item');
        dispatch(getRegionsAction(state.regions.pagination.page) as any);
        statusFooterButttonsModal(false);
        showModal(false);
        swal(response.data.message, {
          icon: 'success'
        });
        setTimeout(() => {
          $region.removeClass('editing-item');
        }, 1000);
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);

        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function deleteRegionAction(id: string) {
  return (dispatch: Dispatch<RegionReduxAction>, getState: () => {regions: IRegionsState}) => {
    const state = getState();
    const api: ApiService = new ApiService();
    api.deleteRegion(id)
      .then((response: AxiosResponse): void => {
        // effect when removing user
        swal(response.data.message, {
          icon: 'success'
        });
        $(`#region-${id}`).addClass('deleted-item');
        setTimeout(() => {
          dispatch(getRegionsAction(state.regions.pagination.page) as any);
        }, 500);
      })
      .catch((err: AxiosError): void => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type RegionReduxAction =
  ICancelRequest |
  IIsLoading |
  IChangeTempRegion |
  ILoadRegion |
  IChangePage;
