import {CompaniesReduxAction, ICompaniesState} from '../actions/companies.actions';

const initialState: ICompaniesState = {
  companies: [],
  tempCompany: {
    name: ''
  },
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function companiesReducer(state = initialState, action: CompaniesReduxAction): ICompaniesState {
  switch (action.type) {
    case '/COMPANIES/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/COMPANIES/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/COMPANIES/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    case '/COMPANIES/CHANGE_TEMP_COMPANY':
      return {
        ...state,
        tempCompany: action.payload.company
      };
    case '/COMPANIES/LOAD_COMPANIES':
      return {
        ...state,
        companies: action.payload.companies,
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
