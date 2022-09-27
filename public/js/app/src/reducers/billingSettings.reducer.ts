import {
  CANCEL_BILLING_SETINGS,
  IBillingSettingsActionTypes,
  IBillingSettingsState,
  LOAD_ALL_COMPANIES_BILLING_SETINGS,
  LOAD_ALL_MODULES_BILLING_SETINGS,
  LOAD_BILLING_SETINGS,
  LOAD_INVOICE,
  LOADING_BILLING_SETINGS
} from '../actions/billingSettings.types';
import * as moment from 'moment';

const initialState: IBillingSettingsState = {
  loading: true,
  source: null,
  companies: [],
  modules: [],
  billingSettings: null,
  invoice: null,
  oldest: null,
  last: null
};

export default function billingSettingsReducer(state = initialState, action: IBillingSettingsActionTypes): IBillingSettingsState {
  switch (action.type) {
    case LOADING_BILLING_SETINGS:
      return {
        ...state,
        loading: action.payload.loading
      };
    case LOAD_ALL_COMPANIES_BILLING_SETINGS:
      return {
        ...state,
        companies: action.payload.companies
      };
    case LOAD_ALL_MODULES_BILLING_SETINGS:
      return {
        ...state,
        modules: action.payload.modules
      };
    case LOAD_ALL_MODULES_BILLING_SETINGS:
      return {
        ...state,
        modules: action.payload.modules
      };
    case LOAD_BILLING_SETINGS:
      return {
        ...state,
        billingSettings: action.payload.billingSettings
        // pagination: {
        //   ...state.pagination,
        //   pages: action.payload.pages,
        //   page: action.payload.page,
        //   count: action.payload.count
        // }
      };
    case LOAD_INVOICE:
      return {
        ...state,
        invoice: action.payload.invoice,
        oldest: moment(action.payload.oldest, 'YYYYMM'),
        last: moment(action.payload.last, 'YYYYMM')
      };
    case CANCEL_BILLING_SETINGS:
      return {
        ...state,
        source: action.payload.source
      };
    default:
      return state;
  }
}
