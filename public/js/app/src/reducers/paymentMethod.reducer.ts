import {
  IPaymentMethodState,
  PAYMENT_METHOD_CANCEL,
  PAYMENT_METHOD_CHANGE_ORDER,
  PAYMENT_METHOD_IS_LOADING,
  PAYMENT_METHOD_LOAD,
  PaymentMethodReduxActions
} from '../actions/paymentMethod.types';

const initialState: IPaymentMethodState = {
  paymentMethods: [],
  loading: true,
  source: null,
  options:{
    orderBy: '_id',
    orderType: 'descending'
  },
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function paymentMethodReducer(state = initialState, action: PaymentMethodReduxActions): IPaymentMethodState {
  switch (action.type) {
    case PAYMENT_METHOD_CANCEL:
      return {
        ...state,
        source: action.payload.source
      };
    case PAYMENT_METHOD_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case PAYMENT_METHOD_CHANGE_ORDER:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
    case PAYMENT_METHOD_LOAD:
      return {
        ...state,
        paymentMethods: action.payload.paymentMethods,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          page: action.payload.page,
          count: action.payload.count
        }
      };
    default:
      return state;
  }
}
