import {DashboardTimingReduxAction, IDashboardTimingState} from "../actions/dashboardTiming.actions";

const initialState: IDashboardTimingState = {
  data: {},
  venues: [],
  loading: true,
};

export function dashboardTimingReducer(state = initialState, action: DashboardTimingReduxAction): IDashboardTimingState {
  switch (action.type) {
    case '/DASHBOARD/TIMING/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/DASHBOARD/TIMING/LOAD_DATA':
      return {
        ...state,
        loading: false,
        venues: action.payload.venues,
        data: action.payload.data
      };
    default:
      return state;
  }
}
