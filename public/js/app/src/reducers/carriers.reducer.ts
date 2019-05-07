import {CarrierReduxAction, ICarriersState} from '../actions/carriers.actions';

const initialState: ICarriersState = {
  carriers: [],
  tempCarrier: {
    name: ''
  },
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function carriersReducer(state = initialState, action: CarrierReduxAction): ICarriersState {
  switch (action.type) {
    case '/CARRIERS/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/CARRIERS/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/CARRIERS/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    case '/CARRIERS/CHANGE_TEMP_CARRIER':
      return {
        ...state,
        tempCarrier: action.payload.carrier
      };
    case '/CARRIERS/LOAD_CARRIERS':
      return {
        ...state,
        carriers: action.payload.carriers,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          count: action.payload.count
        }
      };
    default:
      return state;
  }
}
