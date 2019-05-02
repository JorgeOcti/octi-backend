import {IVenue} from '../../../../../src/interfaces/venue.interface';
import {IVenuesState, VenueReduxAction} from '../actions/venues.actions';

const initialState: IVenuesState = {
  venues: [],
  allVenues: [],
  companies: [],
  carriers: [],
  regions: [],
  loading: true,
  source: null,
  tempVenue: {
    _id: '',
    name: '',
    type: 'receiver',
    sendTo: [],
    receiveFrom: [],
    shippingCarriers: [],
    receptionCarriers: []
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
    case '/VENUES/LOAD_COMPANIES':
      return {
        ...state,
        companies: action.payload.companies
      };
    case '/VENUES/LOAD_ALL_VENUES':
      return {
        ...state,
        allVenues: action.payload.allVenues
      };
    case '/VENUES/LOAD_CARRIERS':
      return {
        ...state,
        carriers: action.payload.carriers
      };
    case '/VENUES/LOAD_REGIONS':
      return {
        ...state,
        regions: action.payload.regions
      };
    case '/VENUES/CHANGE_VENUE':
      return {
        ...state,
        venues: state.venues.map((venue: IVenue) => {
          if (venue._id === action.payload.venue._id) {
            venue.name = action.payload.venue.name;
            venue.company = action.payload.venue.company;
            venue.type = action.payload.venue.type;
            venue.sendTo = action.payload.venue.sendTo;
            venue.receiveFrom = action.payload.venue.receiveFrom;
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
