import { ISalesChannelState,
  RequestChannelReduxActions,
  REQUEST_CANCEL_CHANNEL,
  REQUEST_CHANGE_ORDER,
  REQUEST_IS_LOADING,
  REQUEST_LOAD_CHANNEL
} from '../actions/requestChannel.types';

const initialState: ISalesChannelState = {
  channels: [],
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

export function requestChannelReducer(state = initialState, action: RequestChannelReduxActions): ISalesChannelState {
  switch (action.type) {
    case REQUEST_CANCEL_CHANNEL:
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
    case REQUEST_LOAD_CHANNEL:
      return {
        ...state,
        channels: action.payload.channels,
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
