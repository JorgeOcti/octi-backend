import { IRequestStatusState,
  RequestStatusReduxActions,
  REQUEST_CANCEL_STATUS,
  REQUEST_CHANGE_ORDER,
  REQUEST_IS_LOADING,
  REQUEST_LOAD_STATUS
} from '../actions/requestStatus.types';

const initialState: IRequestStatusState = {
  status: [],
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

export function requestStatusReducer(state = initialState, action: RequestStatusReduxActions): IRequestStatusState {
  switch (action.type) {
    case REQUEST_CANCEL_STATUS:
      return {
        ...state,
        source: action.payload.source
      };
    case REQUEST_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case REQUEST_CHANGE_ORDER:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
    case REQUEST_LOAD_STATUS:
      return {
        ...state,
        status: action.payload.status,
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
