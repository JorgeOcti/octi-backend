import {IBaseCompany} from '../../../../../src/app/interfaces/company.interface';
import {ClientCompaniesReduxAction, IClientCompaniesState} from '../actions/clientCompanies.actions';

const initialState: IClientCompaniesState = {
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
    notifications: []
  },
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function clientCompaniesReducer(state = initialState, action: ClientCompaniesReduxAction): IClientCompaniesState {
  switch (action.type) {
    case '/CLIENT_COMPANIES/IS_LOADING':
      return { ...state, loading: action.payload.loading };
    case '/CLIENT_COMPANIES/CANCEL_REQUEST':
      return { ...state, source: action.payload.source };
    case '/CLIENT_COMPANIES/CHANGE_PAGE':
      return {
        ...state,
        pagination: { ...state.pagination, page: action.payload.page }
      };
    case '/CLIENT_COMPANIES/CHANGE_TEMP_COMPANY':
      return { ...state, tempCompany: action.payload.company };
    case '/CLIENT_COMPANIES/CHANGE_COMPANY':
      return {
        ...state,
        companies: state.companies.map((company: IBaseCompany) => {
          if (company._id === action.payload.company._id) {
            company.name = action.payload.company.name;
            company.businessName = action.payload.company.businessName;
            company.rut = action.payload.company.rut;
            company.image = action.payload.company.image;
          }
          return company;
        })
      };
    case '/CLIENT_COMPANIES/LOAD_COMPANIES':
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
