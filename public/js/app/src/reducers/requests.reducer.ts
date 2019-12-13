import {IRequestsState, RequestsReduxActions} from "../actions/requests.actions";

const initialState: IRequestsState = {
  requests: [],
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function requestsReducers(state = initialState, action: RequestsReduxActions): IRequestsState {
  switch (action.type) {
    case '/REQUESTS/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/REQUESTS/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/REQUESTS/LOAD_REQUEST':
      return {
        ...state,
        requests: action.payload.requests,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          page: action.payload.page,
          count: action.payload.count
        }
      };
    default:
      return state;
  }
}
