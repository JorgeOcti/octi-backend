import {RegionReduxAction, IRegionsState} from '../actions/regions.actions';

const initialState: IRegionsState = {
  regions: [],
  tempRegion: {
    name: '',
    code: ''
  },
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function regionsReducer(state = initialState, action: RegionReduxAction): IRegionsState {
  switch (action.type) {
    case '/REGIONS/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/REGIONS/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/REGIONS/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    case '/REGIONS/CHANGE_TEMP_REGION':
      return {
        ...state,
        tempRegion: action.payload.region
      };
    case '/REGIONS/LOAD_REGIONS':
      return {
        ...state,
        regions: action.payload.regions,
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
