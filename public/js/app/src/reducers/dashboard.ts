import {DashboardReduxAction, IDashboardState} from '../actions/dashboard';

const initialState: IDashboardState = {
  loading: true,
  source: null,
  cars: [],
  car: null,
  participantsPerDate: [],
  carsPerDate: [],
  totalCars: 0,
  loadingParticipant: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function dashboard(state = initialState, action: DashboardReduxAction): IDashboardState {
  switch (action.type) {
    case '/DASHBOARD/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/DASHBOARD/LOAD_CARS':
      return {
        ...state,
        cars: action.payload.cars,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          count: action.payload.count
        }
      };
    case '/DASHBOARD/LOADING_PARTICIPANT':
      return {
        ...state,
        loadingParticipant: action.payload.loadingParticipant
      };
    case '/DASHBOARD/LOAD_PARTICIPANTS_PER_DATE':
      return {
        ...state,
        participantsPerDate: action.payload.participantsPerDate,
        carsPerDate: action.payload.carsPerDate,
        totalCars: action.payload.totalCars
      };
    case '/DASHBOARD/LOAD_CAR':
      return {
        ...state,
        car: action.payload.car
      };
    case '/DASHBOARD/LOAD_PARTICIPANT_IN_CAR':
      if (state.car && state.car.participants) {
        return {
          ...state,
          car: {
            ...state.car,
            participants: [action.payload.participant, ...state.car.participants]
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
    default:
      return state;
  }
}
