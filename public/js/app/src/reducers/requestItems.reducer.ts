import {
  IRequestItemsState,
  RequestItemsReduxActions,
  REQUEST_ITEMS_CANCEL_REQUEST,
  REQUEST_ITEMS_CHANGE_FILTER,
  REQUEST_ITEMS_CHANGE_ORDER,
  REQUEST_ITEMS_CREATE_ITEM,
  REQUEST_ITEMS_DELETE_ITEM,
  REQUEST_ITEMS_IS_LOADING,
  REQUEST_ITEMS_LOAD_CARRIERS,
  REQUEST_ITEMS_LOAD_ITEM_STATUS,
  REQUEST_ITEMS_LOAD_PROPERTIES,
  REQUEST_ITEMS_LOAD_REASONS,
  REQUEST_ITEMS_LOAD_REQUESTS_ITEMS,
  REQUEST_ITEMS_LOAD_VENUES,
  REQUEST_ITEMS_LOAD_BRANDS,
  REQUEST_ITEMS_UPDATE_ITEM, REQUEST_ITEMS_LOAD_SETTINGS, REQUEST_ITEMS_LOAD_USERS
} from '../actions/requestItems.types';
import { requestSettings } from '../components/Request/defaults';
import * as moment from 'moment';

const initialState: IRequestItemsState = {
  requestItems: [],
  reasons: [],
  carriers: [],
  venues: [],
  brands: [],
  users: [],
  properties: [],
  requestItemStatus: [],
  requestItemStatusMin: 0,
  requestItemStatusMax: 100,
  loading: true,
  source: null,
  requestSettings,
  filters: {
    request: '',
    transmittal: '',
    ticket: '',
    conectaID: '',
    entry: '',
    text: '',
    sellerText: '',
    venues: [],
    brands: [],
    users: [],
    properties: [],
    status: [],
    from: moment().subtract(12, 'months').startOf('day'),
    to: moment().endOf('day')
  },
  options: {
    orderBy: 'meta.request.number',
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
    case REQUEST_ITEMS_LOAD_BRANDS:
      return {
        ...state,
        brands: action.payload.brands
      };
    case REQUEST_ITEMS_LOAD_VENUES:
      return {
        ...state,
        venues: action.payload.venues
      };
    case REQUEST_ITEMS_LOAD_USERS:
      return {
        ...state,
        users: action.payload.users
      };
    case REQUEST_ITEMS_LOAD_PROPERTIES:
        return {
          ...state,
          properties: action.payload.properties
        };
    case REQUEST_ITEMS_LOAD_SETTINGS:
      return {
        ...state,
        requestSettings: action.payload.requestSettings
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
    case REQUEST_ITEMS_CHANGE_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value
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
    case REQUEST_ITEMS_CREATE_ITEM:
      return {
        ...state,
        requestItems: [action.payload.item, ...state.requestItems]
      };
    case REQUEST_ITEMS_UPDATE_ITEM:
      return {
        ...state,
        requestItems: [...state.requestItems.map((item) => {
          if (item._id === action.payload.item._id) {
            return {
              item,
              ...action.payload.item
            };
          }
          return item;
        })]
      };
    case REQUEST_ITEMS_DELETE_ITEM:
      return {
        ...state,
        requestItems: [...state.requestItems.filter((item) => {
          return item._id !== action.payload.item._id;
        })]
      };
    default:
      return state;
  }
}
