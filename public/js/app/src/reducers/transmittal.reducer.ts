import {
  CANCEL_REQUEST_TRANSMITTAL,
  CHANGE_ORDER_TRANSMITTAL, CREATE_TRANSMITTAL_ITEM_TRANSMITTAL,
  DELETE_TRANSMITTAL_ITEM_TRANSMITTAL, DELETE_TRANSMITTAL_TRANSMITTAL,
  FILTER_REQUEST_ITEMS_TRANSMITTAL,
  ITransmittalActionTypes,
  ITransmittalState,
  LOAD_CARRIERS_TRANSMITTAL,
  LOAD_DRIVERS_TRANSMITTAL,
  LOAD_REQUEST_ITEMS_TRANSMITTAL,
  LOAD_TRANSMITTAL,
  LOAD_VENUES_TRANSMITTAL,
  LOADING_REQUEST_ITEMS_TRANSMITTAL,
  LOADING_TRANSMITTAL,
  TOOGLE_TAB_TRANSMITTAL,
  UPDATE_TRANSMITTAL_ITEM_TRANSMITTAL,
  UPDATE_TRANSMITTAL_TRANSMITTAL
} from "../actions/transmittal.types";
import {ITransmittal} from "../../../../../src/distribution/interfaces/transmittal.interface";

const initialState: ITransmittalState<ITransmittal> = {
  loading: true,
  requestItemsLoading: true,
  data: [],
  carriers: [],
  venues: [],
  drivers: [],
  transmittalOpen: [],
  source: null,
  requestItems: [],
  requestItemsfilters: {
    request: '',
    entry: '',
    text: '',
    venues: [],
    properties: [],
    status: [],
    from: null,
    to: null
  },
  requestItemsPagination: {
    count: 0,
    page: 1,
    pages: 0
  },
  options: {
    orderBy: '_id',
    orderType: 'descending'
  },
  pagination: {
    count: 0,
    page: 1,
    pages: 0
  }
};

export default function transmittalReducer(state= initialState, action: ITransmittalActionTypes): ITransmittalState {
  switch (action.type) {
    case LOADING_TRANSMITTAL:
      return {
        ...state,
        loading: action.payload.loading
      };
    case LOAD_TRANSMITTAL:
      return {
        ...state,
        data: action.payload.data,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          page: action.payload.page,
          count: action.payload.count
        }
      };
    case DELETE_TRANSMITTAL_ITEM_TRANSMITTAL:
      return  {
        ...state,
        data: state.data.map<ITransmittal>((transmittal: any) => {
          if (transmittal._id === action.payload.transmittalItem?.transmittal) {
            return {
              ...transmittal,
              items: transmittal.items.filter((item: any) => {
                return item._id !== action.payload.transmittalItem._id
              })
            }
          }
          return transmittal;
        })
      };
    case DELETE_TRANSMITTAL_TRANSMITTAL:
      return {
        ...state,
        data: state.data.filter((transmittal: any) => {
          return transmittal._id !== action.payload.transmittal._id
        })
      };
    case UPDATE_TRANSMITTAL_TRANSMITTAL:
      return {
        ...state,
        data: state.data.map<ITransmittal>((transmittal: any) => {
          if (transmittal._id === action.payload.transmittal._id) {
            return {
              ...transmittal,
              ...action.payload.transmittal
            }
          } else {
            return transmittal;
          }
        })
      };
    case CREATE_TRANSMITTAL_ITEM_TRANSMITTAL:
      return {
        ...state,
        data: state.data.map<ITransmittal>((transmittal: any) => {
          if (transmittal._id === action.payload.transmittalItem?.transmittal) {
            return {
              ...transmittal,
              items: [...transmittal.items, action.payload.transmittalItem]
            }
          }
          return transmittal;
        })
      };
    case UPDATE_TRANSMITTAL_ITEM_TRANSMITTAL:
      return  {
        ...state,
        data: state.data.map<ITransmittal>((transmittal: any) => {
          if (transmittal._id === action.payload.transmittalItem?.transmittal) {
            return {
              ...transmittal,
              items: transmittal.items.map((item: any) => {
                if (item._id === action.payload.transmittalItem._id) {
                  return {
                    ...item,
                    ...action.payload.transmittalItem
                  }
                }
                return item;
              })
            }
          }
          return transmittal;
        })
      };
    case LOAD_CARRIERS_TRANSMITTAL:
      return {
        ...state,
        carriers: action.payload.carriers,
      };
    case LOAD_DRIVERS_TRANSMITTAL:
      return {
        ...state,
        drivers: action.payload.drivers,
      };
    case LOAD_VENUES_TRANSMITTAL:
      return {
        ...state,
        venues: action.payload.venues,
      };
    case TOOGLE_TAB_TRANSMITTAL:
      return {
        ...state,
        transmittalOpen: state.transmittalOpen.includes(action.payload.transmittalId) ?
          state.transmittalOpen.filter(id => id !== action.payload.transmittalId) :
          [...state.transmittalOpen, action.payload.transmittalId]
      };
    case CHANGE_ORDER_TRANSMITTAL:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
    case CANCEL_REQUEST_TRANSMITTAL:
      return {
        ...state,
        source: action.payload.source
      };
    case LOADING_REQUEST_ITEMS_TRANSMITTAL:
       return {
        ...state,
        requestItemsLoading: action.payload.requestItemsLoading
      };
    case FILTER_REQUEST_ITEMS_TRANSMITTAL:
      return {
        ...state,
        requestItemsfilters: {
          ...state.requestItemsfilters,
          [action.payload.key]: action.payload.value
        }
      };
    case LOAD_REQUEST_ITEMS_TRANSMITTAL:
      return {
        ...state,
        requestItems: action.payload.requestItems,
        requestItemsPagination: {
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
