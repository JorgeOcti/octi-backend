import {AxiosError, AxiosResponse, CancelTokenSource} from 'axios';
import {Dispatch} from 'redux';
import {IInventoryCar} from '../../../../../src/interfaces/inventory.interface';
import {IInventoryComment} from '../../../../../src/interfaces/inventoryComment.interface';
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
  loading: boolean;
  inventoryCar: IInventoryCar | null;
  source: CancelTokenSource | null;
  loadingDetail: boolean;
  summary: IInventorySummary;
  detail: any | null;
  detailByVenue: IDetailByVenue[];
  detailByBrand: IDetailByBrand[];
  carsTable: any[];
  selectedItems: {
    [key: string]: any
  };
  filter: {
    text: string;
    venues: string[];
    states: string[];
  };
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface IUpdateInventoryCar {
  type: '/INVENTORORIES/UPDATE_INVENTORY_CAR';
  payload: {
    inventoryCar: IInventoryCar;
  };
}

export function updateInventoryCarAction(inventoryCar: IInventoryCar): IUpdateInventoryCar {
  return {
    type: '/INVENTORORIES/UPDATE_INVENTORY_CAR',
    payload: {
      inventoryCar
    }
  };
}

interface IAddComment {
  type: '/INVENTORORIES/ADD_COMMENT';
  payload: {
    inventoryComment: IInventoryComment;
  };
}

export function addCommentAction(inventoryComment: IInventoryComment): IAddComment {
  return {
    type: '/INVENTORORIES/ADD_COMMENT',
    payload: {
      inventoryComment
    }
  };
}

interface ICancelRequest {
  type: '/INVENTORORIES/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/INVENTORORIES/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/INVENTORORIES/IS_LOADING';
  payload: {
    loading: boolean;
  };
}
export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/INVENTORORIES/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface ILoadInventories {
  type: '/INVENTORORIES/LOAD_DATA';
  payload: {
    inventories: any[];
  };
}

export function loadInventoriesAction(inventories: any[]): ILoadInventories {
  return {
    type: '/INVENTORORIES/LOAD_DATA',
    payload: {
      inventories
    }
  };
}

export function getInventoriesAction(loading: boolean) {
  return (dispatch: Dispatch<InventoryReduxAction>) => {
    const api: ApiService = new ApiService();
    // if (loading) {
    //   dispatch(isLoadingAction(true));
    // }
    dispatch(cancelRequestAction(api.getSource()));
    api.getInventories()
      .then((response: AxiosResponse) => {
        const data = response.data;
        dispatch(loadInventoriesAction(data.inventories));
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
  return (dispatch: Dispatch<InventoryReduxAction>) => {
    const api: ApiService = new ApiService();
    api.finishInventory(id)
      .then((response: AxiosResponse) => {
        const data = response.data;
        dispatch(getInventoriesAction(false) as any);
        swal('Inventarios', data.message, 'success');
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  };
}

export function deleteInventoryAction(id: string) {
  return (dispatch: Dispatch<InventoryReduxAction>) => {
    const api: ApiService = new ApiService();
    api.deleteInventory(id)
      .then((response: AxiosResponse) => {
        $(`#inventory-${id}`)
          .addClass('deleted-item');
        const data = response.data;
        swal('Inventarios', data.message, 'success');
        setTimeout(() => {
          dispatch(getInventoriesAction(false) as any);
        }, 500);
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  };
}

interface ILoadingDetailInventory {
  type: '/INVENTORORIES/LOADING_INVENTORY_DETAIL';
  payload: {
    loadingDetail: boolean;
  };
}

export function loadingInventoryDetaillAction(loadingDetail: boolean): ILoadingDetailInventory {
  return {
    type: '/INVENTORORIES/LOADING_INVENTORY_DETAIL',
    payload: {
      loadingDetail
    }
  };
}

interface IDetailInventorySelected {
  type: '/INVENTORORIES/CHANGE_SELECTED';
  payload: {
    item: string;
  };
}

export function inventoryDetailChangeSelected(item: string): IDetailInventorySelected {
  return {
    type: '/INVENTORORIES/CHANGE_SELECTED',
    payload: {
      item
    }
  };
}

interface IDetailChangeFilter {
  type: '/INVENTORORIES/CHANGE_FILTER';
  payload: {
    filter: {
      text: string
      venues: string[];
      states: string[];
    };
  };
  meta: {
    debounce: {
      time: number
    }
  };
}

export function inventoryDetailChangeFilter(filter: {
  text: string
  venues: string[];
  states: string[];
}): IDetailChangeFilter {
  return {
    type: '/INVENTORORIES/CHANGE_FILTER',
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

export function inventoryDetailChangeFilterText(filter: {
  text: string
  venues: string[];
  states: string[];
}): IDetailChangeFilter {
  return {
    type: '/INVENTORORIES/CHANGE_FILTER',
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
  type: '/INVENTORORIES/LOAD_INVENTORY_DATA';
  payload: {
    summary: IInventorySummary;
    detailByVenue: IDetailByVenue[];
    detailByBrand: IDetailByBrand[];
    detail: any;
    resetFilter: boolean;
  };
}

export function loadInventoryAction(
  summary: IInventorySummary, detailByVenue: IDetailByVenue[], detailByBrand: IDetailByBrand[], detail: any, resetFilter: boolean
): ILoadInventory {
  return {
    type: '/INVENTORORIES/LOAD_INVENTORY_DATA',
    payload: {
      resetFilter: !resetFilter,
      summary,
      detailByVenue,
      detailByBrand,
      detail
    }
  };
}

export function getInventoryDetailAction(id: string, update: boolean) {
  return (dispatch: Dispatch<InventoryReduxAction>) => {
    if (!update) {
      dispatch(loadingInventoryDetaillAction(true));
    }
    const api: ApiService = new ApiService();
    api.getSource();
    api.getInventory(id)
      .then((response: AxiosResponse) => {
        const {data} = response;
        dispatch(loadInventoryAction(data.summary, data.detailByVenue, data.detailByBrand, data.detail, update));
        dispatch(loadingInventoryDetaillAction(false));
        if (!update) {
          ($('#venues') as any).selectpicker('refresh');
          ($('#states') as any).selectpicker('refresh');
          $('.count').each(function() {
            $(this).prop('Counter', 0).animate({
              Counter: $(this).text()
            }, {
              duration: 1000,
              easing: 'swing',
              step: function(now) {
                $(this).text(Math.ceil(now));
              }
            });
          });
        }
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
        dispatch(loadingInventoryDetaillAction(false));
      });
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

export type InventoryReduxAction = ICancelRequest | IIsLoading | ILoadInventories | ILoadInventory | ILoadingDetailInventory | IUpdateInventoryCar | IAddComment | IDetailChangeFilter| IDetailInventorySelected;
