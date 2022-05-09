import { CancelTokenSource } from 'axios';
import { IMilestone } from '../../../../../src/distribution/interfaces/milestone.interface';
import { IRequestStatus } from '../../../../../src/request/interfaces/requestStatus.interface';
import { IForm } from '../../../../../src/form/interfaces/form.interface';
import { IMilestoneType } from '../../../../../src/distribution/interfaces/milestoneType.interface';

export const MILESTONE_CANCEL_STATUS = '/MILESTONE/CANCEL_STATUS';
export const MILESTONE_IS_LOADING = '/MILESTONE/IS_LOADING';
export const MILESTONE_LOAD_STATUS = '/MILESTONE/LOAD_STATUS';
export const MILESTONE_LOAD_FORMS = '/MILESTONE/LOAD_FORMS';
export const MILESTONE_LOAD_TYPES = '/MILESTONE/LOAD_TYPES';
export const MILESTONE_LOAD_REQUEST_STATUS = '/MILESTONE/LOAD_REQUEST_STATUS';
export const MILESTONE_CREATE_STATUS = '/MILESTONE/CREATE_STATUS';
export const MILESTONE_UDPATE_STATUS = '/MILESTONE/UDPATE_STATUS';
export const MILESTONE_DELETE_STATUS = '/MILESTONE/DELETE_STATUS';
export const MILESTONE_CHANGE_ORDER = '/MILESTONE/CHANGE_ORDER';

export interface IMilestoneState {
  milestones: IMilestone[];
  milestoneTypes: IMilestoneType[];
  requestStatus: IRequestStatus[];
  forms: IForm[];
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

export interface ILoadFormsMilestone {
  type: typeof MILESTONE_LOAD_FORMS;
  payload: {
    forms: IForm[];
  };
}

export interface ILoadTypesMilestone {
  type: typeof MILESTONE_LOAD_TYPES;
  payload: {
    milestoneTypes: IMilestoneType[];
  };
}

export interface ILoadRequestStatusMilestone {
  type: typeof MILESTONE_LOAD_REQUEST_STATUS;
  payload: {
    requestStatus: IRequestStatus[];
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
  ILoadFormsMilestone |
  ILoadTypesMilestone |
  ILoadRequestStatusMilestone |
  ICreateMilestone |
  IUpdateMilestone |
  IDeleteMilestone |
  IChangeOrderMilestone |
  ILoadMilestone;
