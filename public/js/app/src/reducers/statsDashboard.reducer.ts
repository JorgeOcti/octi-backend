import {IStatsDashboardState, StatsDashboardReducerAction} from '../actions/statsDashboard.actions';

const initialState : IStatsDashboardState = {
  loading: true,
  studios: [],
  users: [],
  currentStudio: null,
  tempStudio: {
    _id: '',
    users: [],
    name: '',
    type: '',
    embedURL: '',
    team: null
  },
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};


export function statsDashboardReducer(state: IStatsDashboardState = initialState, action: StatsDashboardReducerAction) {
  switch (action.type) {
    case '/STATS_DASHBOARD/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/STATS_DASHBOARD/LOAD_STUDIOS':
      return {
        ...state,
        studios: action.payload.studios
      };
    case '/STATS_DASHBOARD/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    case '/STATS_DASHBOARD/CHANGE_TEMP_STUDIO':
      return {
        ...state,
        tempStudio: action.payload.tempStudio
      };
    case '/STATS_DASHBOARD/DELETE_USER':
      return state;
    case '/STATS_DASHBOARD/LOAD_STUDIOS_USERS':
      return {
        ...state,
        users: action.payload.users
      };
    default:
      return state;
  }

}

