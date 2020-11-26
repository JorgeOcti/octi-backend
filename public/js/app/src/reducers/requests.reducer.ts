import * as moment from 'moment-timezone';
import {
  IRequestsState,
  RequestsReduxActions,
  REQUEST_CANCEL_REQUEST,
  REQUEST_CHANGE_ORDER,
  REQUEST_CREATE_REQUEST_ITEM_IN_DETAIL,
  REQUEST_CREATE_REQUEST_ITEM_IN_LIST,
  REQUEST_DELETE_REQUEST_IN_LIST,
  REQUEST_DELETE_REQUEST_ITEM_IN_DETAIL,
  REQUEST_DELETE_REQUEST_ITEM_IN_LIST,
  REQUEST_IS_LOADING,
  REQUEST_LOAD_CARRIERS,
  REQUEST_LOAD_REASONS,
  REQUEST_LOAD_REQUEST,
  REQUEST_LOAD_REQUESTS,
  REQUEST_LOAD_REQUEST_ITEM_STATUS,
  REQUEST_TAB_STATUS,
  REQUEST_UDPATE_REQUEST_ITEM_IN_DETAIL,
  REQUEST_UDPATE_REQUEST_ITEM_IN_LIST
} from '../actions/requests.types';

const initialState: IRequestsState = {
  requests: [],
  reasons: [],
  carriers: [],
  requestOpen: [],
  requestItemStatus: [],
  requestItemStatusMin: 0,
  requestItemStatusMax: 100,
  request: {},
  loading: true,
  source: null,
  orderBy: '_id',
  orderType: 'descending',
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function requestsReducers(state = initialState, action: RequestsReduxActions): IRequestsState {
  switch (action.type) {
    case REQUEST_CANCEL_REQUEST:
      return {
        ...state,
        source: action.payload.source
      };
    case REQUEST_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case REQUEST_LOAD_REASONS:
      return {
        ...state,
        reasons: action.payload.reasons
      };
    case REQUEST_LOAD_CARRIERS:
      return {
        ...state,
        carriers: action.payload.carriers
      };
    case REQUEST_TAB_STATUS:
      return {
        ...state,
        requestOpen: state.requestOpen.includes(action.payload.request)
          ? [...state.requestOpen.filter(request => request !== action.payload.request)]
          : [...state.requestOpen, action.payload.request]
      };
    case REQUEST_CHANGE_ORDER:
      return {
        ...state,
        orderBy: action.payload.orderBy,
        orderType: action.payload.orderType
      };
    case REQUEST_LOAD_REQUEST_ITEM_STATUS:
      return {
        ...state,
        requestItemStatus: action.payload.requestItemStatus,
        requestItemStatusMin: action.payload.min,
        requestItemStatusMax: action.payload.max
      };
    case REQUEST_LOAD_REQUESTS:
      return {
        ...state,
        requests: action.payload.requests,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          page: action.payload.page,
          count: action.payload.count
        }
      };
    case REQUEST_CREATE_REQUEST_ITEM_IN_LIST:
      return {
        ...state,
        requests: [...state.requests].map((request) => {
          if (request._id === action.payload.idRequest) {
            request.updatedAt = moment().toDate();
            request.items = [...request.items, action.payload.item];
          }
          return request;
        })
      };
    case REQUEST_UDPATE_REQUEST_ITEM_IN_LIST:
      return {
        ...state,
        requests: [...state.requests].map((request) => {
          if (request._id === action.payload.idRequest) {
            request.updatedAt = moment().toDate();
            request.items = request.items.map((item) => {
              if (item._id === action.payload.item._id) {
                return {
                  item,
                  ...action.payload.item
                };
              }
              return item;
            });
          }
          return request;
        })
      };
    case REQUEST_DELETE_REQUEST_ITEM_IN_LIST:
      return {
        ...state,
        requests: [...state.requests].map((request) => {
          if (request._id === action.payload.idRequest) {
            request.updatedAt = moment().toDate();
            request.items = request.items.filter((item) => {
              return item._id !== action.payload.item._id;
            });
          }
          return request;
        })
      };
    case REQUEST_CREATE_REQUEST_ITEM_IN_DETAIL:
      return {
        ...state,
        request: {
          ...state.request,
          items: [...state.request.items!, action.payload.item]
        }
      };
    case REQUEST_UDPATE_REQUEST_ITEM_IN_DETAIL:
      return {
        ...state,
        request: {
          ...state.request,
          items: [...state.request!.items!.map((item) => {
            if (item._id === action.payload.item._id) {
              return {
                item,
                ...action.payload.item
              };
            }
            return item;
          })]
        }
      };
    case REQUEST_DELETE_REQUEST_ITEM_IN_DETAIL:
      return {
        ...state,
        request: {
          ...state.request,
          items: [...state.request!.items!.filter((item) => {
            return item._id !== action.payload.item._id;
          })]
        }
      };
    case REQUEST_DELETE_REQUEST_IN_LIST:
      return {
        ...state,
        requests: [...state.requests].filter((request) => {
          return request._id !== action.payload.id;
        })
      };
    case REQUEST_LOAD_REQUEST:
      return {
        ...state,
        request: action.payload.request
      };
    default:
      return state;
  }
}
