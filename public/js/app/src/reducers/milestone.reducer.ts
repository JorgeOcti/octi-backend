import {
  IMilestoneState,
  MilestoneReduxActions,
  MILESTONE_CANCEL_STATUS,
  MILESTONE_CHANGE_ORDER,
  MILESTONE_IS_LOADING,
  MILESTONE_LOAD_STATUS
} from '../actions/milestone.types';

const initialState: IMilestoneState = {
  milestones: [],
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
