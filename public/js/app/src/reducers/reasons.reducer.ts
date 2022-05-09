import {
  IReasonsState,
  ReasonsReduxActions,
  REASON_CANCEL_REASON,
  REASON_CHANGE_ORDER,
  REASON_IS_LOADING,
  REASON_LOAD_REASONS
} from '../actions/reasons.types';

const initialState: IReasonsState = {
  reasons: [],
  reason: {},
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

export function reasonsReducers(state = initialState, action: ReasonsReduxActions): IReasonsState {
  switch (action.type) {
    case REASON_CANCEL_REASON:
      return {
        ...state,
        source: action.payload.source
      };
    case REASON_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case REASON_CHANGE_ORDER:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
    case REASON_LOAD_REASONS:
      return {
        ...state,
        reasons: action.payload.reasons,
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
