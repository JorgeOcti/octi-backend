import {
  CANCEL_DELIVERIES,
  CHANGE_FILTER_DELIVERIES,
  IDeliveriesActionTypes,
  IDeliveriesState,
  LOAD_DELIVERIES,
  LOAD_FORMS,
  LOADING_DELIVERIES
} from '../actions/deliveries.types';
import * as moment from 'moment';

const initialState: IDeliveriesState = {
  loading: true,
  source: null,
  forms: [],
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  },
  filters: {
    forms: [],
    searchText: '',
    searchDelivery: '',
    from: moment().subtract(1, 'months').startOf('month'),
    to: moment().endOf('day')
  },
  participants: []
};


export default function deliveriesReducer(state = initialState, action: IDeliveriesActionTypes): IDeliveriesState {
  switch (action.type) {
    case LOADING_DELIVERIES:
      return {
        ...state,
        loading: action.payload.loading
      };
    case CHANGE_FILTER_DELIVERIES:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    case LOAD_FORMS:
      return {
        ...state,
        forms: action.payload.forms
      };
    case LOAD_DELIVERIES:
      return {
        ...state,
        participants: action.payload.participants,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          page: action.payload.page,
          count: action.payload.count
        }
      };
    case CANCEL_DELIVERIES:
      return {
        ...state,
        source: action.payload.source
      };
    default:
      return state;
  }
}
