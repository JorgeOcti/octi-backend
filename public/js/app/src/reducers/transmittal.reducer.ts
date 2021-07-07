import {
  CANCEL_REQUEST_TRANSMITTAL,
  CHANGE_ORDER_TRANSMITTAL,
  ITransmittalActionTypes,
  ITransmittalState, LOAD_CARRIERS_TRANSMITTAL,
  LOAD_TRANSMITTAL, LOAD_VENUES_TRANSMITTAL,
  LOADING_TRANSMITTAL
} from "../actions/transmittal.types";


const initialState: ITransmittalState = {
  loading: true,
  data: [],
  carriers: [],
  venues: [],
  source: null,
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

export default function transmittalReducer(state = initialState, action: ITransmittalActionTypes): ITransmittalState {
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
    case LOAD_CARRIERS_TRANSMITTAL:
      return {
        ...state,
        carriers: action.payload.carriers,
      };
    case LOAD_VENUES_TRANSMITTAL:
      return {
        ...state,
        venues: action.payload.venues,
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
    default:
      return state;
  }
}
