import {IVenuesState, VenueReduxAction} from '../actions/venues.actions';

const initialState: IVenuesState = {
  venues: [],
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function venuesReducer(state = initialState, action: VenueReduxAction): IVenuesState {
  switch (action.type) {
    case '/VENUES/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/VENUES/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/VENUES/CHANGE_PAGE':
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
