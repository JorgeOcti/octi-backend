import {ITransmittal} from '../../../../../src/interfaces/transmittal.interface';
import {CancelTokenSource} from "axios";
import {FormAction} from "redux-form";
import { IVenueModel } from '../../../../../src/app/models/venue.model';
import { ICarrierModel } from '../../../../../src/app/models/carrier.model';


export const LOADING_TRANSMITTAL = '@transmittal/IS_LOADING';
export const LOAD_TRANSMITTAL = '@transmittal/LOAD';
export const LOAD_VENUES_TRANSMITTAL = '@transmittal/LOAD_VENUES';
export const LOAD_CARRIERS_TRANSMITTAL = '@transmittal/LOAD_CARRIERS';
export const CHANGE_ORDER_TRANSMITTAL = '@transmittal/CHANGE_ORDER';
export const CANCEL_REQUEST_TRANSMITTAL = '@transmittal/CANCEL_REQUEST';


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
  options: IOrderListView
}

export interface ITransmittalState<T = ITransmittal> extends IListView<T> {
  venues: IVenueModel[];
  carriers: ICarrierModel[];
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

interface ITransmittalLoadCarrierssAction {
  type: typeof LOAD_CARRIERS_TRANSMITTAL;
  payload: {
    carriers: ICarrierModel[];
  }
}

export type ITransmittalActionTypes =
  FormAction |
  ITransmittalCancerlRequestAction |
  ITransmittalLoadVenuesAction |
  ITransmittalLoadCarrierssAction |
  ITransmittalChangeOrderAction |
  ITransmittalLoadAction |
  ITransmittalLoadingAction;

