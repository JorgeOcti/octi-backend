import {
  IRequestItemsState,
  RequestItemsReduxActions,
  REQUEST_ITEMS_CANCEL_REQUEST,
  REQUEST_ITEMS_CHANGE_ORDER,
  REQUEST_ITEMS_IS_LOADING,
  REQUEST_ITEMS_LOAD_CARRIERS,
  REQUEST_ITEMS_LOAD_ITEM_STATUS,
  REQUEST_ITEMS_LOAD_REASONS,
  REQUEST_ITEMS_LOAD_REQUESTS_ITEMS
} from '../actions/requestItems.types';

const initialState: IRequestItemsState = {
  requestItems: [],
  reasons: [],
  carriers: [],
  requestItemStatus: [],
  requestItemStatusMin: 0,
  requestItemStatusMax: 100,
  loading: true,
  source: null,
  options: {
    orderBy: '_id',
    orderType: 'descending'
  },
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function requestItemsReducers(state = initialState, action: RequestItemsReduxActions): IRequestItemsState {
  switch (action.type) {
    case REQUEST_ITEMS_CANCEL_REQUEST:
      return {
        ...state,
        source: action.payload.source
      };
    case REQUEST_ITEMS_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case REQUEST_ITEMS_LOAD_REASONS:
      return {
        ...state,
        reasons: action.payload.reasons
      };
    case REQUEST_ITEMS_LOAD_CARRIERS:
      return {
        ...state,
        carriers: action.payload.carriers
      };
    case REQUEST_ITEMS_LOAD_ITEM_STATUS:
      return {
        ...state,
        requestItemStatus: action.payload.requestItemStatus,
        requestItemStatusMin: action.payload.min,
        requestItemStatusMax: action.payload.max
      };
    case REQUEST_ITEMS_CHANGE_ORDER:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
    case REQUEST_ITEMS_LOAD_REQUESTS_ITEMS:
      return {
        ...state,
        requestItems: action.payload.requestItems,
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