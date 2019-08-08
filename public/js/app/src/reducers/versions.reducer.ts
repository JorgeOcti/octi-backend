import {IVersionsState, VersionReduxAction} from "../actions/versions.actions";

const initialState: IVersionsState = {
  versions: [],
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function versionsReducer(state = initialState, action: VersionReduxAction): IVersionsState {
  switch (action.type) {
    case '/VERSIONS/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/ALERTS/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/VERSIONS/CREATE':
      return {
        ...state,
        versions: [action.payload.version, ...state.versions]
      };
    case '/VERSIONS/LOAD_DATA':
      return {
        ...state,
        versions: action.payload.versions
      };
    default:
      return state;
  }
}
