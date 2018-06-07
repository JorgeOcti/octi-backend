import {DashboardReduxAction, IDashboardState} from "../actions/dashboard";

const initialState: IDashboardState = {
  loading: true,
  source: null,
  cars: [],

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
    case '/DASHBOARD/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    default:
      return state;
  }
}
