import {ITransmittal} from '../../../../../src/distribution/interfaces/transmittal.interface';
import {CancelTokenSource} from "axios";
import {IVenueModel} from '../../../../../src/app/models/venue.model';
import {ICarrierModel} from '../../../../../src/app/models/carrier.model';
import {ITransmittalItemModel} from '../../../../../src/distribution/models/transmittalItem.model';
import {IUserModel} from '../../../../../src/app/models/user.model';
import {IRequestItem} from '../../../../../src/request/interfaces/requestItem.interface';
import { ITransmittalModel } from '../../../../../src/distribution/models/transmittal.model';


export const LOADING_TRANSMITTAL = '@transmittal/IS_LOADING';
export const LOAD_TRANSMITTAL = '@transmittal/LOAD';
export const LOAD_VENUES_TRANSMITTAL = '@transmittal/LOAD_VENUES';
export const LOAD_CARRIERS_TRANSMITTAL = '@transmittal/LOAD_CARRIERS';
export const LOAD_DRIVERS_TRANSMITTAL = '@transmittal/LOAD_DRIVERS';
export const TOOGLE_TAB_TRANSMITTAL = '@transmittal/TOOGLE_TAB';
export const CHANGE_ORDER_TRANSMITTAL = '@transmittal/CHANGE_ORDER';
export const CANCEL_REQUEST_TRANSMITTAL = '@transmittal/CANCEL_REQUEST';
export const CREATE_TRANSMITTAL_ITEM_TRANSMITTAL = '@transmittal/CREATE_TRANSMITTAL_ITEM';
export const UPDATE_TRANSMITTAL_ITEM_TRANSMITTAL = '@transmittal/UPDATE_TRANSMITTAL_ITEM';
export const DELETE_TRANSMITTAL_ITEM_TRANSMITTAL = '@transmittal/DELETE_TRANSMITTAL_ITEM';
export const UPDATE_TRANSMITTAL_TRANSMITTAL = '@transmittal/UPDATE_TRANSMITTAL';
export const DELETE_TRANSMITTAL_TRANSMITTAL = '@transmittal/DELETE_TRANSMITTAL';


export interface IPaginationListView {
  count: number;
  page: number;
  pages: number;
}

export interface IOrderListView {
  orderType: string;
  orderBy: string;
}

export interface IListView<T = any> {
  loading: boolean;
  data: T[];
  source: CancelTokenSource | null;
  pagination: IPaginationListView;
  options: IOrderListView;
}

export interface IRequestItemsFilters {
  text: string;
  request: string;
  venues: any[];
  properties: any[];
  status: any[];
  from: any;
  to: any;
}

export interface ITransmittalState<T = ITransmittal> extends IListView<T> {
  requestItemsLoading: boolean;
  venues: IVenueModel[];
  carriers: ICarrierModel[];
  drivers: IUserModel[];
  requestItems: IRequestItem[];
  requestItemsfilters: IRequestItemsFilters;
  requestItemsPagination: IPaginationListView;
  transmittalOpen: string[];
}

export interface ITransmittalChangeOrderAction {
  type: typeof CHANGE_ORDER_TRANSMITTAL;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

interface ITransmittalLoadingAction {
  type: typeof LOADING_TRANSMITTAL;
  payload: {
    loading: boolean;
  }
}

interface ITransmittalCancerlRequestAction {
  type: typeof CANCEL_REQUEST_TRANSMITTAL;
  payload: {
    source: CancelTokenSource;
  }
}

interface ITransmittalLoadAction {
  type: typeof LOAD_TRANSMITTAL;
  payload: {
    data: ITransmittal[];
    count: number;
    pages: number;
    page: number;
  }
}

interface ITransmittalLoadVenuesAction {
  type: typeof LOAD_VENUES_TRANSMITTAL;
  payload: {
    venues: IVenueModel[];
  }
}

interface ITransmittalLoadCarriersAction {
  type: typeof LOAD_CARRIERS_TRANSMITTAL;
  payload: {
    carriers: ICarrierModel[];
  }
}

interface ITransmittalLoadDriversAction {
  type: typeof LOAD_DRIVERS_TRANSMITTAL;
  payload: {
    drivers: IUserModel[];
  }
}

interface ITransmittalToogleTabAction {
  type: typeof TOOGLE_TAB_TRANSMITTAL;
  payload: {
    transmittalId: string;
  }
}

interface ICreateTransmittalItemAction {
  type: typeof CREATE_TRANSMITTAL_ITEM_TRANSMITTAL;
  payload: {
    transmittalItem: Partial<ITransmittalItemModel>;
  }
}

interface IUpdateTransmittalItemAction {
  type: typeof UPDATE_TRANSMITTAL_ITEM_TRANSMITTAL;
  payload: {
    transmittalItem: Partial<ITransmittalItemModel>;
  }
}

interface IDeleteTransmittalAction {
  type: typeof DELETE_TRANSMITTAL_TRANSMITTAL;
  payload: {
    transmittal: Partial<ITransmittalModel>;
  }
}

interface IDeleteTransmittalItemAction {
  type: typeof DELETE_TRANSMITTAL_ITEM_TRANSMITTAL;
  payload: {
    transmittalItem: Partial<ITransmittalItemModel>;
  }
}

interface IUpdateTransmittalAction {
  type: typeof UPDATE_TRANSMITTAL_TRANSMITTAL;
  payload: {
    transmittal: Partial<ITransmittalModel>;
  }
}

// SEARCH CARS IN REQUEST
export const LOAD_REQUEST_ITEMS_TRANSMITTAL = '@transmittal/LOAD_REQUEST_ITEMS';
export const LOADING_REQUEST_ITEMS_TRANSMITTAL = '@transmittal/LOADING_REQUEST_ITEMS';
export const FILTER_REQUEST_ITEMS_TRANSMITTAL = '@transmittal/FILTER_REQUEST_ITEMS';

export interface IChangeFilterRequestItemsTransmittalItemAction  {
  type: typeof FILTER_REQUEST_ITEMS_TRANSMITTAL;
  payload: {
    key: keyof IRequestItemsFilters;
    value: any | any[];
  };
}

export interface ILoadRequestItemsTransmittalItemAction  {
  type: typeof LOAD_REQUEST_ITEMS_TRANSMITTAL;
  payload: {
    requestItems: IRequestItem[];
    count: number;
    pages: number
    page: number;
  };
}

export interface ILoadingRequestItemsTransmittalItemAction  {
  type: typeof LOADING_REQUEST_ITEMS_TRANSMITTAL;
  payload: {
    requestItemsLoading: boolean;
  };
}

export type ITransmittalActionTypes =
  ITransmittalCancerlRequestAction |
  ITransmittalLoadVenuesAction |
  ITransmittalLoadCarriersAction |
  ITransmittalToogleTabAction |
  ITransmittalChangeOrderAction |
  ITransmittalLoadAction |
  IUpdateTransmittalAction |
  IDeleteTransmittalItemAction |
  ICreateTransmittalItemAction |
  IUpdateTransmittalItemAction |
  IDeleteTransmittalAction |
  ITransmittalLoadDriversAction |
  IChangeFilterRequestItemsTransmittalItemAction |
  ILoadRequestItemsTransmittalItemAction |
  ILoadingRequestItemsTransmittalItemAction |
  ITransmittalLoadingAction;

