import {BillingReduxAction, IBillingState} from "../actions/billing.actions";

const initialState: IBillingState = {
  invoices: [],
  source: null,
  loading: true,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function billingReducer(state = initialState, action: BillingReduxAction): any {
  switch (action.type) {
    case '/BILLING/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/BILLING/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/BILLING/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    case '/BILLING/LOAD_BILLING':
      return {
        ...state,
        invoices: action.payload.invoices,
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
