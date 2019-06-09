import {DashboardDamagesReduxAction, IDashboardDamagesState} from "../actions/dashboardDamages.actions";

const initialState: IDashboardDamagesState = {
  data: {},
  venues: [],
  loading: true
};

export function dashboardDamagesReducer(state = initialState, action: DashboardDamagesReduxAction): IDashboardDamagesState {
  switch (action.type) {
    case '/DASHBOARD/DAMAGES/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/DASHBOARD/DAMAGES/LOAD_DATA':
      return {
        ...state,
        data: action.payload.data
      };
    default:
      return state;
  }
}
