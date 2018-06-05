import {IUsersState, UserReduxAction} from "../actions/users";
import {IUser} from "../../../../../src/interfaces/user";

const initialState: IUsersState = {
  loading: true,
  users: [],
  source: null,
  tempUser: {
    _id:'',
    firstName: '',
    lastName: '',
    email: ''
  },
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
    case '/USERS/CHANGE_TEMP_USER':
      return {
        ...state,
        tempUser: action.payload.user
      };
    case '/USERS/CHANGE_USER':
      return {
        ...state,
        users: state.users.map((user) => (user._id === action.payload.user._id ? action.payload.user : user))
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
    case '/USERS/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/USERS/DELETE_USER':
      return {
        ...state,
        users: state.users.filter((user: IUser) => user._id !== action.payload.id)
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
