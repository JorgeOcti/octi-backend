import { CancelTokenSource } from 'axios';
import { IMilestoneType } from '../../../../../src/distribution/interfaces/milestoneType.interface';

export const MILESTONE_TYPE_CANCEL_STATUS = '/MILESTONE_TYPE/CANCEL_STATUS';
export const MILESTONE_TYPE_IS_LOADING = '/MILESTONE_TYPE/IS_LOADING';
export const MILESTONE_TYPE_LOAD_STATUS = '/MILESTONE_TYPE/LOAD_STATUS';
export const MILESTONE_TYPE_CREATE_STATUS = '/MILESTONE_TYPE/CREATE_STATUS';
export const MILESTONE_TYPE_UDPATE_STATUS = '/MILESTONE_TYPE/UDPATE_STATUS';
export const MILESTONE_TYPE_DELETE_STATUS = '/MILESTONE_TYPE/DELETE_STATUS';
export const MILESTONE_TYPE_CHANGE_ORDER = '/MILESTONE_TYPE/CHANGE_ORDER';

export interface IMilestoneTypeState {
  milestoneTypes: IMilestoneType[];
  loading: boolean;
  source: CancelTokenSource | null;
  options: {
    orderBy: string;
    orderType: string;
  };
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

export interface ICancelMilestoneType {
  type: typeof MILESTONE_TYPE_CANCEL_STATUS;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingMilestoneType {
  type: typeof MILESTONE_TYPE_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadMilestoneType {
  type: typeof MILESTONE_TYPE_LOAD_STATUS;
  payload: {
    milestoneTypes: IMilestoneType[];
    count: number;
    pages: number
    page: number
  };
}

export interface ICreateMilestoneType {
  type: typeof MILESTONE_TYPE_CREATE_STATUS;
  payload: {
    milestoneType: IMilestoneType
  };
}

export interface IUpdateMilestoneType {
  type: typeof MILESTONE_TYPE_UDPATE_STATUS;
  payload: {
    milestoneType: IMilestoneType
  };
}

export interface IDeleteMilestoneType {
  type: typeof MILESTONE_TYPE_DELETE_STATUS;
  payload: {
    milestoneType: IMilestoneType
  };
}

export interface IChangeOrderMilestoneType {
  type: typeof MILESTONE_TYPE_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type MilestoneTypeReduxActions =
  ICancelMilestoneType |
  IIsLoadingMilestoneType |
  ICreateMilestoneType |
  IUpdateMilestoneType |
  IDeleteMilestoneType |
  IChangeOrderMilestoneType |
  ILoadMilestoneType;
