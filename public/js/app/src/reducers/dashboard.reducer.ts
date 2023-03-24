import {
  DashboardReduxAction,
  IDashboardState
} from '../actions/dashboard.actions';
import * as moment from 'moment-timezone';

const initialState: IDashboardState = {
  loading: true,
  source: null,
  participants: [],
  requests: [],
  companies: [],
  car: null,
  carEvents: {},
  forms: [],
  searchForms: [],
  participantsReceivedPerDate: [],
  participantsSentPerDate: [],
  participantPerRange: [],
  carsPerDate: [],
  planningPerDate: [],
  planningProcessPerDate: [],
  searchText: '',
  searchFrom: moment()
    .startOf('month')
    .subtract(2, 'months')
    .startOf('month')
    .toDate(),
  searchTo: moment().toDate(),
  carsByVenue: [],
  totalCars: 0,
  loadingParticipant: null,
  revisionStats: null,
  venueStats: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function dashboardReducer(
  state = initialState,
  action: DashboardReduxAction
): IDashboardState {
  switch (action.type) {
    case '/DASHBOARD/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/DASHBOARD/LOAD_PARTICIPANTS':
      return {
        ...state,
        participants: action.payload.participants,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          count: action.payload.count
        }
      };
    case '/DASHBOARD/CHANGE_SEARCH':
      return {
        ...state,
        searchText: action.payload.searchText
      };
    case '/DASHBOARD/CHANGE_RANGE':
      return {
        ...state,
        searchFrom: action.payload.from,
        searchTo: action.payload.to
      };
    case '/DASHBOARD/LOADING_PARTICIPANT':
      return {
        ...state,
        loadingParticipant: action.payload.loadingParticipant
      };
    case '/DASHBOARD/LOAD_PARTICIPANTS_PER_DATE':
      return {
        ...state,
        companies: action.payload.companies,
        participantsReceivedPerDate: action.payload.participantsReceivedPerDate,
        participantsSentPerDate: action.payload.participantsSentPerDate,
        carsPerDate: action.payload.carsPerDate,
        planningPerDate: action.payload.planningPerDate,
        planningProcessPerDate: action.payload.planningProcessPerDate,
        totalCars: action.payload.totalCars,
        carsByVenue: action.payload.carsByVenue,
        participantPerRange: action.payload.participantPerRange
      };
    case '/DASHBOARD/LOAD_CAR':
      return {
        ...state,
        car: action.payload.car
      };
    case '/DASHBOARD/LOAD_REQUESTS_IN_CAR':
      return {
        ...state,
        requests: action.payload.requests
      };
    case '/DASHBOARD/LOAD_PARTICIPANT_IN_CAR':
      if (state.car && state.car.participants) {
        return {
          ...state,
          car: {
            ...state.car,
            participants: [
              action.payload.participant,
              ...state.car.participants
            ]
          }
        };
      } else {
        return state;
      }
    case '/DASHBOARD/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/DASHBOARD/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    case '/DASHBOARD/LOAD_VENUES_STATS':
      return {
        ...state,
        venueStats: action.payload.venuesStats
      };
    case '/DASHBOARD/LOAD_REVISION_STATS':
      return {
        ...state,
        revisionStats: action.payload.revisionStats
      };
    case '/DASHBOARD/LOAD_FORMS':
      return {
        ...state,
        forms: action.payload.forms
      };
    case '/DASHBOARD/CHANGE_FORM_SEARCH':
      return {
        ...state,
        searchForms: action.payload.searchForms
      };
    default:
      return state;
  }
}
