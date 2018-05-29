import {IUsersState, UserReduxAction} from "../actions/users";

const initialState: IUsersState = {
  loading: true,
  users: [],
};

export function users(state = initialState, action: UserReduxAction): IUsersState {
  switch (action.type) {
    case 'IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case 'LOAD_USERS':
      return {
        ...state,
        users: action.payload.users
      };
    default:
      return state;
  }
}
