import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { IMilestoneType } from '../../../../../src/distribution/interfaces/milestoneType.interface';
import ApiService from '../utils/axios';
import {
  MILESTONE_TYPE_IS_LOADING,
  MILESTONE_TYPE_CHANGE_ORDER,
  MILESTONE_TYPE_CANCEL_STATUS,
  MILESTONE_TYPE_LOAD_STATUS,
  MILESTONE_TYPE_CREATE_STATUS,
  MILESTONE_TYPE_UDPATE_STATUS,
  MILESTONE_TYPE_DELETE_STATUS,
  ICreateMilestoneType,
  ICancelMilestoneType,
  IIsLoadingMilestoneType,
  ILoadMilestoneType,
  IUpdateMilestoneType,
  IDeleteMilestoneType,
  IChangeOrderMilestoneType,
  IMilestoneTypeState,
  MilestoneTypeReduxActions
} from './milestoneType.types';

export function cancelMilestoneTypeAction(source: CancelTokenSource): ICancelMilestoneType {
  return {
    type: MILESTONE_TYPE_CANCEL_STATUS,
    payload: {
      source
    }
  };
}

export function isLoadingMilestoneTypeAction(loading: boolean): IIsLoadingMilestoneType {
  return {
    type: MILESTONE_TYPE_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadMilestoneTypeAction(milestoneTypes: IMilestoneType[], count: number, pages: number, page: number): ILoadMilestoneType {
  return {
    type: MILESTONE_TYPE_LOAD_STATUS,
    payload: {
      milestoneTypes,
      count,
      pages,
      page
    }
  };
}


export function createMilestoneTypeItemAction(milestoneType: IMilestoneType): ICreateMilestoneType {
  return {
    type: MILESTONE_TYPE_CREATE_STATUS,
    payload: {
      milestoneType
    }
  };
}

export function updateMilestoneTypeItemAction(milestoneType: IMilestoneType): IUpdateMilestoneType {
  return {
    type: MILESTONE_TYPE_UDPATE_STATUS,
    payload: {
      milestoneType
    }
  };
}


export function deleteMilestoneTypeAction(milestoneType: IMilestoneType): IDeleteMilestoneType {
  return {
    type: MILESTONE_TYPE_DELETE_STATUS,
    payload: {
      milestoneType
    }
  };
}

export function changeOrderMilestoneTypeAction(orderBy: string, orderType: string): IChangeOrderMilestoneType {
  return {
    type: MILESTONE_TYPE_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getMilestoneTypesThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) {
  return (dispatch: Dispatch<MilestoneTypeReduxActions>, getState: () => { milestoneType: IMilestoneTypeState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingMilestoneTypeAction(!hideLoading));
    const page = nextPage ? nextPage : state.milestoneType.pagination.page;
    dispatch(changeOrderMilestoneTypeAction(orderBy, orderType));
    dispatch(cancelMilestoneTypeAction(api.getSource()));
    Axios
      .all([
        api.getMilestoneTypes({ page, orderBy, orderType })
      ])
      .then(Axios.spread((milestoneTypes) => {
        const { data } = milestoneTypes;
        dispatch(loadMilestoneTypeAction(data.results, data.count, data.pages, page));
        dispatch(isLoadingMilestoneTypeAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingMilestoneTypeAction(false));
        api.errorHandler(err);
      });
  };

}

export function createMilestoneTypeThunkAction(milestoneType: IMilestoneType) {
  return (dispatch: Dispatch<MilestoneTypeReduxActions>) => {
    const api: ApiService = new ApiService();
    api.createMilestoneType(milestoneType)
      .then((response: AxiosResponse) => {
        // dispatch(updateMilestoneTypeItemAction(idMilestoneType, data));
      });
  };
}

export function updateMilestoneTypeThunkAction(milestoneType: IMilestoneType) {
  return (dispatch: Dispatch<MilestoneTypeReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateMilestoneType(milestoneType)
      .then((response: AxiosResponse) => {
        // dispatch(updateMilestoneTypeItemAction(idMilestoneType, data));
      });
  };
}

export function deleteMilestoneTypeItemThunkAction(milestoneType: IMilestoneType) {
  return (dispatch: Dispatch<MilestoneTypeReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteMilestoneType(milestoneType)
      .then((response: AxiosResponse) => {
        // dispatch(updateMilestoneTypeItemAction(idMilestoneType, data));
      });
  };
}
