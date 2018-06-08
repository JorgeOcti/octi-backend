import {DashboardReduxAction, IDashboardState} from "../actions/dashboard";

const initialState: IDashboardState = {
  loading: true,
  source: null,
  cars: [],
  car: null
};

export function dashboard(state = initialState, action: DashboardReduxAction): IDashboardState {
  switch (action.type) {
    case '/DASHBOARD/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading,
      };
    case '/DASHBOARD/LOAD_CARS':
      return {
        ...state,
        cars: action.payload.cars
      };
    case '/DASHBOARD/LOAD_CAR':
      return {
        ...state,
        car: action.payload.car
      };
    case '/DASHBOARD/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    default:
      return state;
  }
}
