import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { IColor } from '../../../../../src/app/interfaces/color.interface';
import ApiService from '../utils/axios';
import {
  COLOR_IS_LOADING,
  COLOR_CHANGE_ORDER,
  COLOR_CANCEL,
  COLOR_LOAD,
  COLOR_CREATE,
  COLOR_UDPATE,
  COLOR_DELETE,
  ICreateColor,
  ICancelColor,
  IIsLoadingColor,
  ILoadColor,
  IUpdateColor,
  IDeleteColor,
  IChangeOrderColor,
  IColorState,
  ColorReduxActions
} from './color.types';
import { showModal, statusFooterButttonsModal } from '../utils/common';
import * as swal from 'sweetalert';

export function cancelColorAction(source: CancelTokenSource): ICancelColor {
  return {
    type: COLOR_CANCEL,
    payload: {
      source
    }
  };
}

export function isLoadingColorAction(loading: boolean): IIsLoadingColor {
  return {
    type: COLOR_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadColorAction(colors: IColor[], count: number, pages: number, page: number): ILoadColor {
  return {
    type: COLOR_LOAD,
    payload: {
      colors,
      count,
      pages,
      page
    }
  };
}


export function createColorAction(color: IColor): ICreateColor {
  return {
    type: COLOR_CREATE,
    payload: {
      color
    }
  };
}

export function updateColorAction(color: IColor): IUpdateColor {
  return {
    type: COLOR_UDPATE,
    payload: {
      color
    }
  };
}


export function deleteColorAction(color: IColor): IDeleteColor {
  return {
    type: COLOR_DELETE,
    payload: {
      color
    }
  };
}

export function changeOrderColorAction(orderBy: string, orderType: string): IChangeOrderColor {
  return {
    type: COLOR_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getColorsThunkAction(colorType: string, nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) {
  return (dispatch: Dispatch<ColorReduxActions>, getState: () => { color: IColorState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingColorAction(!hideLoading));
    const page = nextPage ? nextPage : state.color.pagination.page;
    dispatch(changeOrderColorAction(orderBy, orderType));
    dispatch(cancelColorAction(api.getSource()));
    Axios
      .all([
        api.getColors({ page })
      ])
      .then(Axios.spread((colors) => {
        const { data } = colors;
        dispatch(loadColorAction(data.results, data.count, data.pages, page));
        dispatch(isLoadingColorAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingColorAction(false));
        api.errorHandler(err);
      });
  };

}

export function createColorThunkAction(color: IColor) {
  return (dispatch: Dispatch<ColorReduxActions>) => {
    const api: ApiService = new ApiService();
    statusFooterButttonsModal(true);
    api.createColor(color)
      .then((response: AxiosResponse) => {
        const { data } = response;
        dispatch(createColorAction(data.result));
         swal(response.data.message, {
          icon: 'success'
        });
        statusFooterButttonsModal(false);
        showModal(false);
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        api.errorHandler(err);
      });
  };
}

export function updateColorThunkAction(color: IColor) {
  return (dispatch: Dispatch<ColorReduxActions>) => {
    const api: ApiService = new ApiService();
    statusFooterButttonsModal(true);
    api.updateColor(color)
      .then((response: AxiosResponse) => {
        const { data } = response;
        swal(response.data.message, {
          icon: 'success'
        });
        dispatch(updateColorAction(data.result));
        statusFooterButttonsModal(false);
        showModal(false);
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        api.errorHandler(err);
      });
  };
}

export function deleteColorThunkAction(color: IColor) {
  return (dispatch: Dispatch<ColorReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteColor(color)
      .then((response: AxiosResponse) => {
        const { data } = response;
        dispatch(deleteColorAction(data.id));
      });
  };
}
