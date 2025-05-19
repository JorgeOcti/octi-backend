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
  brands: [],
  forms: [],
  filter: {
    searchForms: [],
    searchBrands: [],
    searchText: '',
    searchFrom: moment()
      .startOf('month')
      .subtract(1, 'months')
      .startOf('month')
      .toDate(),
    searchTo: moment().toDate(),
  },
  participantsReceivedPerDate: [],
  participantsSentPerDate: [],
  participantPerRange: [],
  carsPerDate: [],
  planningPerDate: [],
  planningProcessPerDate: [],
  carsByVenue: [],
  totalCars: 0,
  loadingParticipant: null,
  revisionStats: null,
  venueStats: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  },
  revisionAnswers: {}
};

export function dashboardReducer(
  state = initialState,
  action: DashboardReduxAction
): IDashboardState {
  switch (action.type) {

    case '/DASHBOARD/UPDATE_PARTICIPANT_ANSWER':
      return {
        ...state,
        revisionAnswers: {
          ...state.revisionAnswers,
          [String(action.payload.answers._id)]: action.payload.answers.answer
        }
      };



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
    case '/DASHBOARD/UPDATE_FILTER':
      return {
        ...state,
        filter: action.payload.filter
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
    case '/DASHBOARD/LOAD_BRANDS':
      return {
        ...state,
        brands: action.payload.brands
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
    default:
      return state;
  }
}
