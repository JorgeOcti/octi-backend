import {CarReduxAction, ICarsState} from '../actions/cars';

const initialState: ICarsState = {
  cars: [],
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function cars(state = initialState, action: CarReduxAction): ICarsState {
  switch (action.type) {
    case '/CARS/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/CARS/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/CARS/LOAD_CARS':
      return {
        ...state,
        cars: action.payload.cars,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          count: action.payload.count
        }
      };
    case '/CARS/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    default:
      return state;
  }
}
