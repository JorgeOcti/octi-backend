import { IOperationTypeState,
  OperationTypeReduxActions,
  OPERATION_TYPE_CANCEL_STATUS,
  OPERATION_TYPE_CHANGE_ORDER,
  OPERATION_TYPE_IS_LOADING,
  OPERATION_TYPE_LOAD_STATUS
} from '../actions/operationType.types';

const initialState: IOperationTypeState = {
  operationTypes: [],
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

export function operationTypeReducer(state = initialState, action: OperationTypeReduxActions): IOperationTypeState {
  switch (action.type) {
    case OPERATION_TYPE_CANCEL_STATUS:
      return {
        ...state,
        source: action.payload.source
      };
    case OPERATION_TYPE_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case OPERATION_TYPE_CHANGE_ORDER:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
    case OPERATION_TYPE_LOAD_STATUS:
      return {
        ...state,
        operationTypes: action.payload.operationTypes,
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
