import {
  IMilestoneState,
  MilestoneReduxActions,
  MILESTONE_CANCEL_STATUS,
  MILESTONE_CHANGE_ORDER,
  MILESTONE_IS_LOADING,
  MILESTONE_LOAD_STATUS, MILESTONE_LOAD_FORMS, MILESTONE_LOAD_REQUEST_STATUS, MILESTONE_UDPATE_STATUS
} from '../actions/milestone.types';

const initialState: IMilestoneState = {
  milestones: [],
  requestStatus: [],
  forms: [],
  loading: true,
  source: null,
  options:{
    orderBy: '_id',
    orderType: 'descending'
  },
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function milestoneReducer(state = initialState, action: MilestoneReduxActions): IMilestoneState {
  switch (action.type) {
    case MILESTONE_CANCEL_STATUS:
      return {
        ...state,
        source: action.payload.source
      };
    case MILESTONE_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case MILESTONE_CHANGE_ORDER:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
     case MILESTONE_UDPATE_STATUS:
      return {
        ...state,
        milestones: [...state.milestones.map((milestone) => {
          if (milestone._id === action.payload.milestone._id) {
            return {
              milestone,
              ...action.payload.milestone
            };
          }
          return milestone;
        })]
      };
    case MILESTONE_LOAD_FORMS:
      return {
        ...state,
        forms: action.payload.forms
      };
    case MILESTONE_LOAD_REQUEST_STATUS:
      return {
        ...state,
        requestStatus: action.payload.requestStatus
      };
    case MILESTONE_LOAD_STATUS:
      return {
        ...state,
        milestones: action.payload.milestones,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          page: action.payload.page,
          count: action.payload.count
        }
      };
    default:
      return state;
  }
}
