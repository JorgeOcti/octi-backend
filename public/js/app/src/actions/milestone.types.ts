import { CancelTokenSource } from 'axios';
import { IMilestone } from '../../../../../src/distribution/interfaces/milestone.interface';

export const MILESTONE_CANCEL_STATUS = '/MILESTONE/CANCEL_STATUS';
export const MILESTONE_IS_LOADING = '/MILESTONE/IS_LOADING';
export const MILESTONE_LOAD_STATUS = '/MILESTONE/LOAD_STATUS';
export const MILESTONE_CREATE_STATUS = '/MILESTONE/CREATE_STATUS';
export const MILESTONE_UDPATE_STATUS = '/MILESTONE/UDPATE_STATUS';
export const MILESTONE_DELETE_STATUS = '/MILESTONE/DELETE_STATUS';
export const MILESTONE_CHANGE_ORDER = '/MILESTONE/CHANGE_ORDER';

export interface IMilestoneState {
  milestones: IMilestone[];
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

export interface ICancelMilestone {
  type: typeof MILESTONE_CANCEL_STATUS;
  payload: {
    source: CancelTokenSource;
  };
}

export interface IIsLoadingMilestone {
  type: typeof MILESTONE_IS_LOADING;
  payload: {
    loading: boolean;
  };
}

export interface ILoadMilestone {
  type: typeof MILESTONE_LOAD_STATUS;
  payload: {
    milestones: IMilestone[];
    count: number;
    pages: number
    page: number
  };
}

export interface ICreateMilestone {
  type: typeof MILESTONE_CREATE_STATUS;
  payload: {
    milestone: IMilestone
  };
}

export interface IUpdateMilestone {
  type: typeof MILESTONE_UDPATE_STATUS;
  payload: {
    milestone: IMilestone
  };
}

export interface IDeleteMilestone {
  type: typeof MILESTONE_DELETE_STATUS;
  payload: {
    milestone: IMilestone
  };
}

export interface IChangeOrderMilestone {
  type: typeof MILESTONE_CHANGE_ORDER;
  payload: {
    orderBy: string;
    orderType: string;
  };
}

export type MilestoneReduxActions =
  ICancelMilestone |
  IIsLoadingMilestone |
  ICreateMilestone |
  IUpdateMilestone |
  IDeleteMilestone |
  IChangeOrderMilestone |
  ILoadMilestone;
