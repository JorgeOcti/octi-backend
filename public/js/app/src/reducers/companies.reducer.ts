import {ICompany} from '../../../../../src/app/interfaces/company.interface';
import {CompaniesReduxAction, ICompaniesState} from '../actions/companies.actions';

const initialState: ICompaniesState = {
  companies: [],
  tempCompany: {
    name: '',
    businessName: '',
    rut: '',
    imageURI: null,
    image: null,
    markerURI: null,
    marker: null,
    billing: {
      active: false,
      inventoryPrice: 0.0,
      checklistPrice: 0.0,
      requestPrice: 0.0,
      deliveryPrice: 0.0
    },
    notifications:[]
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
    case '/COMPANIES/CHANGE_COMPANY':
      return {
        ...state,
        companies: state.companies.map((company: ICompany) => {
          if (company._id === action.payload.company._id) {
            company.name = action.payload.company.name;
            company.businessName = action.payload.company.businessName;
            company.rut = action.payload.company.rut;
            company.billing = action.payload.company.billing;
            company.notifications = action.payload.company.notifications;
            company.image = action.payload.company.image;
            company.marker = action.payload.company.marker;
          }
          return company;
        })
      };
    case '/COMPANIES/DELETE_COMPANY':
      return {
        ...state,
        companies: state.companies.filter((company: ICompany) => company._id !== action.payload.id),
        pagination: {
          ...state.pagination,
          count: state.pagination.count - 1
        }
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
