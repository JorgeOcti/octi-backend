import {IVenue} from '../../../../../src/interfaces/venue.interface';
import {IVenuesState, VenueReduxAction} from '../actions/venues.actions';

const initialState: IVenuesState = {
  venues: [],
  loading: true,
  source: null,
  tempVenue: {
    _id:'',
    name: ''
  },
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
    case '/VENUES/CHANGE_VENUE':
      return {
        ...state,
        venues: state.venues.map((venue) => {
          if (venue._id === action.payload.venue._id) {
            venue.name = action.payload.venue.name;
          }
          return venue;
        })
      };

    case '/VENUES/CHANGE_TEMP_VENUE':
      return {
        ...state,
        tempVenue: action.payload.venue
      };
    case '/VENUES/DELETE_VENUE':
      return {
        ...state,
        venues: state.venues.filter((venue: IVenue) => venue._id !== action.payload.id),
        pagination: {
          ...state.pagination,
          count: state.pagination.count - 1
        }
      };
    case '/VENUES/LOAD_VENUES':
      return {
        ...state,
        venues: action.payload.venues,
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
