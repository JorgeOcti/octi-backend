import {BorderReduxAction, IBorderState} from "../actions/borders.actions";
import {IBorder} from "../../../../../src/app/interfaces/border.interface";

const initialState : IBorderState = {
  searchText: '',
  loading: true,
  source: null,
  borders: [],
  companies: [],
  tempBorder: {
    _id: '',
    lat: 0,
    lng: 0,
    name: ''
  },
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
}

export function bordersReducer(state: IBorderState = initialState, action: BorderReduxAction) : IBorderState {
  switch (action.type) {
    case "/BORDERS/CANCEL_REQUEST":
      return {
        ...state,
        source: action.payload.source
      };
    case "/BORDERS/IS_LOADING":
      return {
        ...state,
        loading: action.payload.loading
      };
    case "/BORDERS/CHANGE_PAGE":
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    case "/BORDERS/CHANGE_SEARCH":
      return {
        ...state,
        searchText: action.payload.searchText
      };
    case "/BORDERS/CHANGE_TEMP_BORDER":
      return {
        ...state,
        tempBorder: action.payload.border
      };
    case "/BORDERS/LOAD_BORDERS":
      return {
        ...state,
        borders: action.payload.borders,
        pagination: {
          ...state.pagination,
          count: action.payload.count,
          pages: action.payload.pages
        }
      };
    case "/BORDERS/LOAD_COMPANIES":
      return {
        ...state,
        companies: action.payload.companies
      };
    case "/BORDERS/DELETE_BORDER":
      return {
        ...state,
        borders: state.borders.filter((borders: IBorder) => borders._id !== action.payload.id),
        pagination: {
          ...state.pagination,
          count: state.pagination.count - 1
        }
      };

    default:
      return state;
  }

}
