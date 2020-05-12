import {IPlanningState, PlanningReduxAction} from "../actions/planning.action";

const initialState: IPlanningState = {
  plannings: [],
  loading: true,
  source: null,
  pagination: {
     count: 0,
    page: 1,
    pages: 1
  }
};

export function planningReducer(state = initialState, action: PlanningReduxAction): IPlanningState {
  switch (action.type) {
    case '/PLANNING/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/PLANNING/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/PLANNING/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    case '/PLANNING/LOAD_PLANNING':
      return {
        ...state,
        plannings: action.payload.plannings,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          count: action.payload.count
        }
      };
    default:
      return state;
  }
}
