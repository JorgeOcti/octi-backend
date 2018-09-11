import {AlertReduxAction, IAlertsState} from '../actions/alerts.action';

const initialState: IAlertsState = {
  alerts: [],
  users: [],
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function alerts(state = initialState, action: AlertReduxAction): IAlertsState {
  switch (action.type) {
    case '/ALERTS/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/ALERTS/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/ALERTS/DELETE':
      return {
        ...state,
        alerts: state.alerts.filter((alert) => alert._id !== action.payload.id)
      };
    case '/ALERTS/CREATE':
      return {
        ...state,
        alerts: [action.payload.alert, ...state.alerts]
      };
    case '/ALERTS/LOAD_DATA':
      return {
        ...state,
        users: action.payload.users,
        alerts: action.payload.alerts
      };
    default:
      return state;
  }
}
