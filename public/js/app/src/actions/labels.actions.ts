import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import {
  IInventoryLabel
} from '../../../../../src/interfaces/inventoryLabel.interface';
import ApiService from '../utils/axios';
import {showModal, statusFooterButttonsModal} from '../utils/common';

export interface ILabelsState {
  labels: IInventoryLabel[];
  loading: boolean;
  tempLabel: IInventoryLabel;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/LABELS/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/LABELS/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/LABELS/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/LABELS/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/LABELS/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/LABELS/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface IChangeTempLabel {
  type: '/LABELS/CHANGE_TEMP_LABEL';
  payload: {
    tempLabel: IInventoryLabel;
  };
  meta: {
    debounce: {
      time: number
    }
  };
}

export function changeTempLabelAction(tempLabel: IInventoryLabel, debounce?: number): IChangeTempLabel {
  return {
    type: '/LABELS/CHANGE_TEMP_LABEL',
    payload: {
      tempLabel
    },
    meta: {
      debounce: {
        time: debounce ? debounce : 0
      }
    }
  };
}

interface ICreateLabel {
  type: '/LABELS/CREATE_LABEL';
  payload: {
    label: IInventoryLabel;
  };
}

export function createLabel(label: IInventoryLabel): ICreateLabel {
  return {
    type: '/LABELS/CREATE_LABEL',
    payload: {
      label
    }
  };
}

export function createLabelAction(label: IInventoryLabel) {
  return (dispatch: Dispatch<LabelsReduxAction>) => {
    const api: ApiService = new ApiService();
    api.createLabel(label)
      .then((response: AxiosResponse) => {
        showModal(false);
        dispatch(createLabel(response.data.label));
        statusFooterButttonsModal(false);
        swal(response.data.message, {
          icon: 'success'
        });
        const $label = $(`#label-${response.data.label._id}`);
        $label.addClass('editing-item');
        setTimeout(() => {
          $label.removeClass('editing-item');
        }, 1000);
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
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

interface ILoadLabels {
  type: '/LABELS/LOAD_LABELS';
  payload: {
    labels: any;
    count: number;
    pages: number
  };
}

export function loadLabelsAction(labels: any, count: number, pages: number): ILoadLabels {
  return {
    type: '/LABELS/LOAD_LABELS',
    payload: {
      labels,
      count,
      pages
    }
  };
}

export function getLabelsAction(nextPage: number) {
  return (dispatch: Dispatch<LabelsReduxAction>, getState: () => {labels: ILabelsState}) => {
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
    api.getLabels(page)
      .then((response: AxiosResponse) => {
        dispatch(loadLabelsAction(response.data.results, response.data.count, response.data.pages));
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

interface IChangeLabel {
  type: '/LABELS/CHANGE_LABEL';
  payload: {
    label: IInventoryLabel;
  };
}

export function changeLabel(label: IInventoryLabel): IChangeLabel {
  return {
    type: '/LABELS/CHANGE_LABEL',
    payload: {
      label
    }
  };
}

export function changeLabelAction(label: IInventoryLabel, message?: boolean) {
  return (dispatch: Dispatch<LabelsReduxAction>) => {
    const api: ApiService = new ApiService();
    api.updateLabel(label)
      .then((response: AxiosResponse) => {
        if (message) {
          statusFooterButttonsModal(false);
          showModal(false);
          const $label = $(`#label-${label._id}`);
          $label.addClass('editing-item');
          setTimeout(() => {
            $label.removeClass('editing-item');
          }, 1000);
          swal(response.data.message, {
            icon: 'success'
          });
        }
        dispatch(changeLabel(label));
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
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

interface IDeleteLabel {
  type: '/LABELS/DELETE_LABEL';
  payload: {
    id: string;
  };
}

export function processDeleteLabelAction(id: string): IDeleteLabel {
  return {
    type: '/LABELS/DELETE_LABEL',
    payload: {
      id
    }
  };
}

export function deleteLabelAction(id: string) {
  return (dispatch: Dispatch<LabelsReduxAction>) => {
    const api: ApiService = new ApiService();
    api.deleteLabel(id)
      .then((response: AxiosResponse): void => {
        // effect when removing user
        swal(response.data.message, {
          icon: 'success'
        });
        $(`#label-${id}`)
          .addClass('deleted-item');
        setTimeout(() => {
          dispatch(processDeleteLabelAction(id));
        }, 500);
      })
      .catch((err: AxiosError): void => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type LabelsReduxAction = ICancelRequest | IIsLoading | IChangePage | ILoadLabels | IChangeTempLabel | IChangeLabel | IDeleteLabel | ICreateLabel;
