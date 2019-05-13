import {DashboardTimingReduxAction, IDashboardTimingState} from "../actions/dashboardTiming.actions";

const initialState: IDashboardTimingState = {
  data: {
    months: [],
    overdue: [],
    ontime: []
  },
  per_venue: {},
  venues: [],
  venuesDict: {},
  loading: true,
  loadingPerVenue: false
};

export function dashboardTimingReducer(state = initialState, action: DashboardTimingReduxAction): IDashboardTimingState {
  switch (action.type) {
    case '/DASHBOARD/TIMING/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/DASHBOARD/TIMING/LOAD_DATA':
      var venuesDict: any = {}
      action.payload.venues.forEach((v: any) => venuesDict[v._id] = v )
      return {
        ...state,
        loading: false,
        venues: action.payload.venues,
        venuesDict,
        data: action.payload.data
      };
    case '/DASHBOARD/TIMING/IS_LOADING_PER_VENUE':
      return {
        ...state,
        loadingPerVenue: true
      };
    case '/DASHBOARD/TIMING/LOAD_DATA_PER_VENUE':
      return {
        ...state,
        loadingPerVenue: false,
        per_venue: action.payload.per_venue
      };

    default:
      return state;
  }
}
