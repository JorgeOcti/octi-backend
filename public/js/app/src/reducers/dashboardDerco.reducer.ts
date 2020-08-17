import {DashboardDercoReduxAction, IDashboardDercoState} from "../actions/dashboardDerco.actions";

const initialState: IDashboardDercoState = {
  cleaning: {
    loading: false,
    days: [],
    clean: [],
    notClean: [],
  }
};

export function dashboardDercoReducer(state = initialState, action: DashboardDercoReduxAction): IDashboardDercoState {
  switch (action.type) {
    case '/DASHBOARD/CLEANING/IS_LOADING':
      return {
        ...state,
        cleaning: {
          ...state.cleaning,
          loading: true
        },
      };
    case '/DASHBOARD/CLEANING/LOAD_DATA_DAILY':
      return {
        ...state,
        cleaning: {
          ...action.payload.cleaning,
          loading: false
        },

      };

    default:
      return state;
  }
}
