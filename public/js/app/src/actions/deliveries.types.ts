import { CancelTokenSource } from 'axios';
import { IForm } from '../../../../../src/form/interfaces/form.interface';
import { IParticipant } from '../../../../../src/form/interfaces/participant.interface';
import { ThunkDispatch } from 'redux-thunk';

export const LOADING_DELIVERIES = '@deliveries/LOADING_DELIVERIES';
export const LOAD_DELIVERIES = '@deliveries/LOAD_DELIVERIES';
export const LOAD_FORMS = '@deliveries/LOAD_FORMS';
export const CHANGE_FILTER_DELIVERIES = '@deliveries/CHANGE_FILTER_DELIVERIES';
export const CANCEL_DELIVERIES = '@deliveries/CANCEL_DELIVERIES';

interface IDeliveriesLoadingAction {
  type: typeof LOADING_DELIVERIES;
  payload: {
    loading: boolean;
  };
}

interface IDeliveriesLoadAction {
  type: typeof LOAD_DELIVERIES;
  payload: {
    participants: IParticipant[];
    count: number;
    page: number;
    pages: number;
  };
}

interface IDeliveriesLoadFormsAction {
  type: typeof LOAD_FORMS;
  payload: {
    forms: IForm[];
  }
}

interface IDeliveriesCancelAction {
  type: typeof CANCEL_DELIVERIES;
  payload: {
    source: CancelTokenSource;
  };
}

export type DeliveriesFilterFields = 'forms' | 'from' | 'to' | 'searchText'| 'searchDelivery';
export type DeliveriesFilterValues = any | any[];
export type DeliveriesFilter = Record<DeliveriesFilterFields, DeliveriesFilterValues>

interface IDeliveriesChangeFilterAction {
  type: typeof CHANGE_FILTER_DELIVERIES;
  payload: Partial<DeliveriesFilter>;
}

export interface IDeliveriesState {
  forms: IForm[];
  participants: IParticipant[];
  loading: boolean;
  source: CancelTokenSource | null;
  filters: DeliveriesFilter;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

export type IDeliveryDispatch = ThunkDispatch<{ deliveries: IDeliveriesState }, {}, IDeliveriesActionTypes>;

export type IDeliveriesActionTypes =
  IDeliveriesLoadingAction |
  IDeliveriesChangeFilterAction |
  IDeliveriesLoadAction |
  IDeliveriesLoadFormsAction |
  IDeliveriesCancelAction;

