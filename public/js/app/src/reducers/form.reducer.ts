import { IFormsState,
  FormReduxActions,
  FORM_CANCEL_STATUS,
  FORM_CHANGE_ORDER,
  FORM_IS_LOADING,
  FORM_LOAD_STATUS,
  FORM_LOAD_REQUEST_STATUS
} from '../actions/form.types';
import { MILESTONE_LOAD_REQUEST_STATUS } from '../actions/milestone.types';

const initialState: IFormsState = {
  forms: [],
  requestStatus: [],
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

export function formsReducer(state = initialState, action: FormReduxActions): IFormsState {
  switch (action.type) {
    case FORM_CANCEL_STATUS:
      return {
        ...state,
        source: action.payload.source
      };
    case FORM_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case FORM_CHANGE_ORDER:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
    case FORM_LOAD_REQUEST_STATUS:
      return {
        ...state,
        requestStatus: action.payload.requestStatus
      };
    case FORM_LOAD_STATUS:
      return {
        ...state,
        forms: action.payload.forms,
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
