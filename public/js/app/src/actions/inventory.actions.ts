import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {IInventoryCar} from '../../../../../src/inventory/interfaces/inventory.interface';
import {IInventorySettting} from '../../../../../src/app/interfaces/teamSetting.interface';
import {IInventoryComment} from '../../../../../src/inventory/interfaces/inventoryComment.interface';
import {IInventoryLabel} from '../../../../../src/inventory/interfaces/inventoryLabel.interface';
import {IFilterCar} from '../reducers/inventory.reducer';
import ApiService from '../utils/axios';

export interface IInventorySummaryResult {
  pending: number;
  found: number;
  leftover: number;
  reported: number;
  missing: number;
}

export interface IInventorySummary {
  _id: string;
  name: string;
  createdBy?: {
    lastName: string;
    firstName: string;
    fullName: string;
  };
  results?: IInventorySummaryResult;
  status: string;
  createdAt: Date | null;
  finalizedAt: Date | null;
}

export interface IDetailByVenue {
  _id: string;
  name: string;
  results: {
    pending: number;
    found: number;
    leftover: number;
    missing: number;
    reported: number;
  };
}

export interface IDetailByBrand {
  name: string;
  results: {
    pending: number;
    found: number;
    missing: number;
    leftover: number;
    reported: number;
  };
}

export interface IInventoryState {
  inventories: any[];
  inventorySettings: IInventorySettting;
  loading: boolean;
  inventoryCar: IInventoryCar | null;
  source: CancelTokenSource | null;
  loadingDetail: boolean;
  fetchingDetail: boolean;
  summary: IInventorySummary;
  detail: any | null;
  detailByVenue: IDetailByVenue[];
  labels: IInventoryLabel[];
  detailByBrand: IDetailByBrand[];
  carsTable: any[];
  cardTypes: string[];
  cardProperties: string[];
  selectedItems: {
    [key: string]: any
  };
  filter: IFilterCar;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface IUpdateInventoryCar {
  type: '/INVENTORIES/UPDATE_INVENTORY_CAR';
  payload: {
    inventoryCar: IInventoryCar;
  };
}

export function updateInventoryCarAction(inventoryCar: IInventoryCar): IUpdateInventoryCar {
  return {
    type: '/INVENTORIES/UPDATE_INVENTORY_CAR',
    payload: {
      inventoryCar
    }
  };
}

interface IAddComment {
  type: '/INVENTORIES/ADD_COMMENT';
  payload: {
    inventoryComment: IInventoryComment;
  };
}

export function addCommentAction(inventoryComment: IInventoryComment): IAddComment {
  return {
    type: '/INVENTORIES/ADD_COMMENT',
    payload: {
      inventoryComment
    }
  };
}

interface ICancelRequest {
  type: '/INVENTORIES/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/INVENTORIES/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/INVENTORIES/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/INVENTORIES/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface ILoadInventories {
  type: '/INVENTORIES/LOAD_DATA';
  payload: {
    inventories: any[];
    inventorySettings: any;
    count: number;
    pages: number
    page: number
  };
}

export function loadInventoriesAction(inventories: any[], inventorySettings: any, count: number, pages: number, page: number): ILoadInventories {
  return {
    type: '/INVENTORIES/LOAD_DATA',
    payload: {
      inventories,
      inventorySettings,
      count,
      pages,
      page
    }
  };
}

export function getInventoriesAction(loading: boolean, nextPage: number,) {
  return (dispatch: Dispatch<InventoryReduxAction>, getState: () => {inventories: IInventoryState}) => {
    const api: ApiService = new ApiService();
    const state = getState();
    if (loading) {
      window.scrollTo(0, 0);
      dispatch(isLoadingAction(true));
    }
    const page = nextPage ? nextPage : state.inventories.pagination.page;
    dispatch(cancelRequestAction(api.getSource()));
    api.getInventories(page)
      .then((response: AxiosResponse) => {
        const data = response.data;
        dispatch(loadInventoriesAction(data.inventories, data.inventorySettings, data.count, data.pages, page));
        if (loading) {
          dispatch(isLoadingAction(false));
        }
      })
      .catch((err: AxiosError) => {
        if (loading) {
          dispatch(isLoadingAction(false));
        }
        api.errorHandler(err);
      });
  };
}

export function finishInventoryAction(id: string) {
  return (dispatch: Dispatch<InventoryReduxAction>, getState: () => {inventories: IInventoryState}) => {
    const state = getState();
    const api: ApiService = new ApiService();
    api.finishInventory(id)
      .then((response: AxiosResponse) => {
        const data = response.data;
        dispatch(getInventoriesAction(false, state.inventories.pagination.page) as any);
        swal('Inventarios', data.message, 'success');
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  };
}

export function deleteInventoryAction(id: string) {
  return (dispatch: Dispatch<InventoryReduxAction>, getState: () => {inventories: IInventoryState}) => {
    const state = getState();
    const api: ApiService = new ApiService();
    api.deleteInventory(id)
      .then((response: AxiosResponse) => {
        $(`#inventory-${id}`)
          .addClass('deleted-item');
        const data = response.data;
        swal('Inventarios', data.message, 'success');
        setTimeout(() => {
          dispatch(getInventoriesAction(false, state.inventories.pagination.page) as any);
        }, 500);
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  };
}

interface ILoadingDetailInventory {
  type: '/INVENTORIES/LOADING_INVENTORY_DETAIL';
  payload: {
    loadingDetail: boolean;
  };
}

export function loadingInventoryDetaillAction(loadingDetail: boolean): ILoadingDetailInventory {
  return {
    type: '/INVENTORIES/LOADING_INVENTORY_DETAIL',
    payload: {
      loadingDetail
    }
  };
}

interface IFetchingDetailInventory {
  type: '/INVENTORIES/FETCHING_INVENTORY_DETAIL';
  payload: {
    fetchingDetail: boolean;
  };
}

export function fetchingnventoryDetaillAction(fetchingDetail: boolean): IFetchingDetailInventory {
  return {
    type: '/INVENTORIES/FETCHING_INVENTORY_DETAIL',
    payload: {
      fetchingDetail
    }
  };
}

interface IDetailInventorySelected {
  type: '/INVENTORIES/CHANGE_SELECTED';
  payload: {
    item: string;
  };
}

export function inventoryDetailChangeSelected(item: string): IDetailInventorySelected {
  return {
    type: '/INVENTORIES/CHANGE_SELECTED',
    payload: {
      item
    }
  };
}

interface IDetailChangeFilter {
  type: '/INVENTORIES/CHANGE_FILTER';
  payload: {
    filter: IFilterCar
  };
  meta: {
    debounce: {
      time: number
    }
  };
}

export function inventoryDetailChangeFilter(filter: IFilterCar): IDetailChangeFilter {
  return {
    type: '/INVENTORIES/CHANGE_FILTER',
    payload: {
      filter
    },
    meta: {
      debounce: {
        time: 0
      }
    }
  };
}

export function inventoryDetailChangeFilterText(filter: IFilterCar): IDetailChangeFilter {
  return {
    type: '/INVENTORIES/CHANGE_FILTER',
    payload: {
      filter
    },
    meta: {
      debounce: {
        time: 300
      }
    }
  };
}

interface ILoadInventory {
  type: '/INVENTORIES/LOAD_INVENTORY_DATA';
  payload: {
    summary: IInventorySummary;
    inventorySettings: any;
    detailByVenue: IDetailByVenue[];
    detailByBrand: IDetailByBrand[];
    labels: IInventoryLabel[],
    detail: any;
    resetFilter: boolean;
  };
}

export function loadInventoryAction(
  summary: IInventorySummary,
  inventorySettings: any,
  detailByVenue: IDetailByVenue[],
  detailByBrand: IDetailByBrand[],
  labels: IInventoryLabel[],
  detail: any,
  resetFilter: boolean
): ILoadInventory {
  return {
    type: '/INVENTORIES/LOAD_INVENTORY_DATA',
    payload: {
      resetFilter: !resetFilter,
      summary,
      inventorySettings,
      detailByVenue,
      detailByBrand,
      labels,
      detail
    }
  };
}

let preventRepeatGetInventoryDetail: any;
export function getInventoryDetailAction(id: string, update: boolean) {
  return (dispatch: Dispatch<InventoryReduxAction>, getState: () => { inventories: IInventoryState }) => {
    const state = getState();
    if (state.inventories.fetchingDetail) {
      clearTimeout(preventRepeatGetInventoryDetail);
      preventRepeatGetInventoryDetail = setTimeout(() => (dispatch as any)(getInventoryDetailAction(id, update)), 1000);
    } else {
      dispatch(fetchingnventoryDetaillAction(true));
      if (!update) {
        dispatch(loadingInventoryDetaillAction(true));
      }
      const api: ApiService = new ApiService();
      dispatch(cancelRequestAction(api.getSource()));
      api.getInventory(id)
        .then((response: AxiosResponse) => {
          const {data} = response;
          dispatch(loadInventoryAction(
            data.summary,
            data.inventorySettings,
            data.detailByVenue,
            data.detailByBrand,
            data.labels,
            data.detail,
            update
          ));
          dispatch(fetchingnventoryDetaillAction(false));
          dispatch(loadingInventoryDetaillAction(false));
          if (!update) {
            $('.count').each(function() {
              $(this).prop('Counter', 0).animate({
                Counter: $(this).text()
              }, {
                duration: 1500,
                easing: 'swing',
                step: function(now) {
                  $(this).text(Math.ceil(now));
                }
              });
            });
          }
        })
        .catch((err: AxiosError) => {
          if (!Axios.isCancel(err)) {
            api.errorHandler(err);
          }
          dispatch(loadingInventoryDetaillAction(false));
          dispatch(fetchingnventoryDetaillAction(false));
        });
    }
  };
}

export function sendCommentAction(carId: string, comment: string) {
  return (dispatch: Dispatch<InventoryReduxAction>, getState: () => {inventories: IInventoryState}) => {
    const state = getState();
    const api: ApiService = new ApiService();
    api.addComment(state.inventories.detail._id, carId, comment)
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  };
}

export function actionSetLabel(inventory: string, car: string, carID: string, label: IInventoryLabel) {
  return (dispatch: Dispatch<InventoryReduxAction>) => {
    const api: ApiService = new ApiService();
    if (label.requireCustomText) {
      (swal as any)('Agregar datos adicionales:', {
        content: 'input'
      }).then((custom: string) => {
        if (custom && custom.trim().length) {
          api.setLabel(inventory, car, carID, label._id, custom)
            .then((response: AxiosResponse) => {
              swal(response.data.message, {
                icon: 'success'
              });
              setTimeout(() => {
                (swal as any).close();
              }, 1000);
            })
            .catch((err: AxiosError) => {
              api.errorHandler(err);
            });
        } else {
          swal('Operación cancelada', {
            icon: 'error'
          });
        }
      });
    } else {
      api.setLabel(inventory, car, carID, label._id)
        .then((response: AxiosResponse) => {
          swal(response.data.message, {
            icon: 'success'
          });
          setTimeout(() => {
            (swal as any).close();
          }, 1500);
        })
        .catch((err: AxiosError) => {
          api.errorHandler(err);
        });
    }
  };
}

export type InventoryReduxAction =
  ICancelRequest |
  IIsLoading |
  ILoadInventories |
  ILoadInventory |
  ILoadingDetailInventory |
  IUpdateInventoryCar |
  IAddComment |
  IDetailChangeFilter |
  IDetailInventorySelected |
  IFetchingDetailInventory;
