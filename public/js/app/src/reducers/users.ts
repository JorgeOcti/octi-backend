import {IUsersState, UserReduxAction} from "../actions/users";

const initialState: IUsersState = {
  loading: true,
  users: [],
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function users(state = initialState, action: UserReduxAction): IUsersState {
  switch (action.type) {
    case '/USERS/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/USERS/LOAD_USERS':
      return {
        ...state,
        users: action.payload.users,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          count: action.payload.count
        }
      };
    case '/USERS/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page,
        }
      };
    default:
      return state;
  }
}
