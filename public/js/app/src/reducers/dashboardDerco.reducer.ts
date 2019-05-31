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
          loading: true,
          ...state.cleaning
        },
      };
    case '/DASHBOARD/CLEANING/LOAD_DATA_DAILY':
      console.log("--payload", action.payload)
      return {
        ...state,
        cleaning: {
          loading: false,
          ...action.payload.cleaning
        },

      };

    default:
      return state;
  }
}
