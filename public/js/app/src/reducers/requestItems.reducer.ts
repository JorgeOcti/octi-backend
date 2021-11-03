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
  REQUEST_ITEMS_UPDATE_ITEM, REQUEST_ITEMS_LOAD_SETTINGS
} from '../actions/requestItems.types';

const initialState: IRequestItemsState = {
  requestItems: [],
  reasons: [],
  carriers: [],
  venues: [],
  properties: [],
  requestItemStatus: [],
  requestItemStatusMin: 0,
  requestItemStatusMax: 100,
  loading: true,
  source: null,
  requestSettings: {
    color: false,
    colorRequired: false,
    denomination: false,
    denominationRequired: false,
    internalNumber: false,
    internalNumberRequired: false,
    internalNumberText: "Número interno",
    material: false,
    materialRequired: false
  },
  filters: {
    request: '',
    entry: '',
    text: '',
    venues: [],
    properties: [],
    status: [],
    from: null,
    to: null
  },
  options: {
    orderBy: 'request.number',
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
    case REQUEST_ITEMS_LOAD_VENUES:
      return {
        ...state,
        venues: action.payload.venues
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
