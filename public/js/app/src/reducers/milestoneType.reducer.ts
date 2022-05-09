import { IMilestoneTypeState,
  MilestoneTypeReduxActions,
  MILESTONE_TYPE_CANCEL_STATUS,
  MILESTONE_TYPE_CHANGE_ORDER,
  MILESTONE_TYPE_IS_LOADING,
  MILESTONE_TYPE_LOAD_STATUS
} from '../actions/milestoneType.types';

const initialState: IMilestoneTypeState = {
  milestoneTypes: [],
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

export function milestoneTypeReducer(state = initialState, action: MilestoneTypeReduxActions): IMilestoneTypeState {
  switch (action.type) {
    case MILESTONE_TYPE_CANCEL_STATUS:
      return {
        ...state,
        source: action.payload.source
      };
    case MILESTONE_TYPE_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case MILESTONE_TYPE_CHANGE_ORDER:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
    case MILESTONE_TYPE_LOAD_STATUS:
      return {
        ...state,
        milestoneTypes: action.payload.milestoneTypes,
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
