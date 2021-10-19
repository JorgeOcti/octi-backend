import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { IMilestone } from '../../../../../src/distribution/interfaces/milestone.interface';
import ApiService from '../utils/axios';
import {
  MILESTONE_IS_LOADING,
  MILESTONE_CHANGE_ORDER,
  MILESTONE_CANCEL_STATUS,
  MILESTONE_LOAD_STATUS,
  MILESTONE_CREATE_STATUS,
  MILESTONE_UDPATE_STATUS,
  MILESTONE_DELETE_STATUS,
  ICreateMilestone,
  ICancelMilestone,
  IIsLoadingMilestone,
  ILoadMilestone,
  IUpdateMilestone,
  IDeleteMilestone,
  IChangeOrderMilestone,
  IMilestoneState,
  MilestoneReduxActions,
  MILESTONE_LOAD_FORMS,
  MILESTONE_LOAD_REQUEST_STATUS,
  ILoadRequestStatusMilestone,
  ILoadFormsMilestone
} from './milestone.types';
import { IForm } from '../../../../../src/form/interfaces/form.interface';
import { IRequestStatus } from '../../../../../src/request/interfaces/requestStatus.interface';

export function cancelMilestoneAction(source: CancelTokenSource): ICancelMilestone {
  return {
    type: MILESTONE_CANCEL_STATUS,
    payload: {
      source
    }
  };
}

export function isLoadingMilestoneAction(loading: boolean): IIsLoadingMilestone {
  return {
    type: MILESTONE_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadMilestoneAction(milestones: IMilestone[], count: number, pages: number, page: number): ILoadMilestone {
  return {
    type: MILESTONE_LOAD_STATUS,
    payload: {
      milestones,
      count,
      pages,
      page
    }
  };
}


export function loadFormsMilestoneAction(forms: IForm[]): ILoadFormsMilestone {
  return {
    type: MILESTONE_LOAD_FORMS,
    payload: {
      forms
    }
  };
}

export function loadRequestStatusMilestoneAction(requestStatus: IRequestStatus[]): ILoadRequestStatusMilestone {
  return {
    type: MILESTONE_LOAD_REQUEST_STATUS,
    payload: {
      requestStatus
    }
  };
}


export function createMilestoneAction(milestone: IMilestone): ICreateMilestone {
  return {
    type: MILESTONE_CREATE_STATUS,
    payload: {
      milestone
    }
  };
}

export function updateMilestoneAction(milestone: IMilestone): IUpdateMilestone {
  return {
    type: MILESTONE_UDPATE_STATUS,
    payload: {
      milestone
    }
  };
}


export function deleteMilestoneAction(milestone: IMilestone): IDeleteMilestone {
  return {
    type: MILESTONE_DELETE_STATUS,
    payload: {
      milestone
    }
  };
}

export function changeOrderMilestoneAction(orderBy: string, orderType: string): IChangeOrderMilestone {
  return {
    type: MILESTONE_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getMilestonesThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) {
  return (dispatch: Dispatch<MilestoneReduxActions>, getState: () => { milestone: IMilestoneState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingMilestoneAction(!hideLoading));
    const page = nextPage ? nextPage : state.milestone.pagination.page;
    dispatch(changeOrderMilestoneAction(orderBy, orderType));
    dispatch(cancelMilestoneAction(api.getSource()));
    Axios
      .all([
        api.getMilestones({ page, orderBy, orderType }),
        api.getForms(1, 200),
        api.getRequestItemsStatus({ page:1,pageSize: 200 })
      ])
      .then(Axios.spread((milestones, forms, requestStatus) => {
        const { data } = milestones;
        dispatch(loadMilestoneAction(data.results, data.count, data.pages, page));
        dispatch(loadFormsMilestoneAction(forms.data.results));
        dispatch(loadRequestStatusMilestoneAction(requestStatus.data.results));
        dispatch(isLoadingMilestoneAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingMilestoneAction(false));
        api.errorHandler(err);
      });
  };

}

/*export function createMilestoneThunkAction(milestone: IMilestone) {
  return (dispatch: Dispatch<MilestoneReduxActions>) => {
    const api: ApiService = new ApiService();
    api.createMilestone(milestone)
      .then((response: AxiosResponse) => {
        // dispatch(updateMilestoneAction(idMilestone, data));
      });
  };
}*/

export function updateMilestoneThunkAction(milestone: IMilestone) {
  return (dispatch: Dispatch<MilestoneReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateMilestone(milestone)
      .then((response: AxiosResponse) => {
        dispatch(updateMilestoneAction(response.data.data));
      });
  };
}

/*export function deleteMilestoneThunkAction(milestone: IMilestone) {
  return (dispatch: Dispatch<MilestoneReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteMilestone(milestone)
      .then((response: AxiosResponse) => {
        // dispatch(updateMilestoneAction(idMilestone, data));
      });
  };
}*/
