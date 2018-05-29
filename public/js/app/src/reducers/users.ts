import {IUsersState, ReduxAction} from "../actions/users";

const initialState: IUsersState = {
  text: '',
  loading: true,
  done: true
};

export function users(state = initialState, action: ReduxAction): IUsersState {
  switch (action.type) {
    case 'IS_LOADING':
      return {
        ...state,
        loading: action.loading
      };
    case "ADD_TODO":
      return {
        ...state
      };

    default:
      return state;
  }
}
