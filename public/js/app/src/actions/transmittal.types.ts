import { CancelTokenSource } from 'axios';
import { IVenue } from '../../../../../src/app/interfaces/venue.interface';
import { ICarrier } from '../../../../../src/app/interfaces/carrier.interface';
import { ITransmittalItem } from '../../../../../src/distribution/interfaces/transmittalItem.interface';
import { IUser } from '../../../../../src/app/interfaces/user.interface';
import { IRequestItem } from '../../../../../src/request/interfaces/requestItem.interface';
import { ITransmittal } from '../../../../../src/distribution/interfaces/transmittal.interface';
import { IMilestoneType } from '../../../../../src/distribution/interfaces/milestoneType.interface';
import { IMilestone } from '../../../../../src/distribution/interfaces';


export const LOADING_TRANSMITTAL = '@transmittal/IS_LOADING';
export const LOAD_TRANSMITTAL = '@transmittal/LOAD';
export const LOAD_TRANSMITTAL_RESUME = '@transmittal/LOAD_RESUME';
export const LOAD_VENUES_TRANSMITTAL = '@transmittal/LOAD_VENUES';
export const LOAD_CARRIERS_TRANSMITTAL = '@transmittal/LOAD_CARRIERS';
export const LOAD_DRIVERS_TRANSMITTAL = '@transmittal/LOAD_DRIVERS';
export const LOAD_MILESTONE_TYPES_TRANSMITTAL = '@transmittal/LOAD_MILESTONE_TYPES';
export const TOOGLE_TAB_TRANSMITTAL = '@transmittal/TOOGLE_TAB';
export const CHANGE_ORDER_TRANSMITTAL = '@transmittal/CHANGE_ORDER';
export const CANCEL_REQUEST_TRANSMITTAL = '@transmittal/CANCEL_REQUEST';
export const CREATE_TRANSMITTAL_ITEM_TRANSMITTAL = '@transmittal/CREATE_TRANSMITTAL_ITEM';
export const UPDATE_TRANSMITTAL_ITEM_TRANSMITTAL = '@transmittal/UPDATE_TRANSMITTAL_ITEM';
export const DELETE_TRANSMITTAL_ITEM_TRANSMITTAL = '@transmittal/DELETE_TRANSMITTAL_ITEM';
export const UPDATE_TRANSMITTAL_TRANSMITTAL = '@transmittal/UPDATE_TRANSMITTAL';
export const DELETE_TRANSMITTAL_TRANSMITTAL = '@transmittal/DELETE_TRANSMITTAL';
export const TRANSPORT_MILESTONE_LOAD_STATUS = '@transmittal/LOAD_MILESTONES';


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
  entry: string;
  venues: any[];
  properties: any[];
  status: any[];
  from: any;
  to: any;
}

export interface ITransmittalState<T = ITransmittal> extends IListView<T> {
  requestItemsLoading: boolean;
  venues: IVenue[];
  carriers: ICarrier[];
  drivers: IUser[];
  milestoneTypes: IMilestoneType[];
  milestones: IMilestone[];
  requestItems: IRequestItem[];
  requestItemsfilters: IRequestItemsFilters;
  requestItemsPagination: IPaginationListView;
  transmittalOpen: string[];
  resume: any[];
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

interface ITransmittalLoadMilestones {
  type: typeof TRANSPORT_MILESTONE_LOAD_STATUS;
  payload: {
    milestones: IMilestone[];
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
    venues: IVenue[];
  }
}

interface ITransmittalLoadCarriersAction {
  type: typeof LOAD_CARRIERS_TRANSMITTAL;
  payload: {
    carriers: ICarrier[];
  }
}

interface ITransmittalLoadDriversAction {
  type: typeof LOAD_DRIVERS_TRANSMITTAL;
  payload: {
    drivers: IUser[];
  }
}

interface ITransmittalLoadMilestoneTypesAction {
  type: typeof LOAD_MILESTONE_TYPES_TRANSMITTAL;
  payload: {
    milestoneTypes: IMilestoneType[];
  }
}

interface ITransmittalToogleTabAction {
  type: typeof TOOGLE_TAB_TRANSMITTAL;
  payload: {
    transmittalId: string;
    status?: boolean;
  }
}

interface ICreateTransmittalItemAction {
  type: typeof CREATE_TRANSMITTAL_ITEM_TRANSMITTAL;
  payload: {
    transmittalItem: Partial<ITransmittalItem>;
  }
}

interface IUpdateTransmittalItemAction {
  type: typeof UPDATE_TRANSMITTAL_ITEM_TRANSMITTAL;
  payload: {
    transmittalItem: Partial<ITransmittalItem>;
  }
}

interface IDeleteTransmittalAction {
  type: typeof DELETE_TRANSMITTAL_TRANSMITTAL;
  payload: {
    transmittal: Partial<ITransmittal>;
  }
}

interface IDeleteTransmittalItemAction {
  type: typeof DELETE_TRANSMITTAL_ITEM_TRANSMITTAL;
  payload: {
    transmittalItem: Partial<ITransmittalItem>;
  }
}

interface IUpdateTransmittalAction {
  type: typeof UPDATE_TRANSMITTAL_TRANSMITTAL;
  payload: {
    transmittal: Partial<ITransmittal>;
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

export interface ILoadTransmittalResume {
  type: typeof LOAD_TRANSMITTAL_RESUME;
  payload: {
    resume: any[]
  }
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
  ITransmittalLoadMilestoneTypesAction |
  IChangeFilterRequestItemsTransmittalItemAction |
  ILoadRequestItemsTransmittalItemAction |
  ILoadingRequestItemsTransmittalItemAction |
  ITransmittalLoadingAction |
  ITransmittalLoadMilestones |
  ILoadTransmittalResume;

