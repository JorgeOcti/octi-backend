import {ILabelsState, LabelsReduxAction} from '../actions/labels.actions';

const initialState: ILabelsState = {
  labels: [],
  loading: true,
  tempLabel: {
    _id: '',
    name: '',
    color: '',
    affected: [],
    sendTo: '',
    requireCustomText: false,
    isExhibition: false,
    active: true
  },
  source: null,
  pagination: {
     count: 0,
    page: 1,
    pages: 1
  }
};

export function labelsReducer(state = initialState, action: LabelsReduxAction): ILabelsState {
  switch (action.type) {
    case '/LABELS/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/LABELS/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/LABELS/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    case '/LABELS/CHANGE_TEMP_LABEL':
      return {
        ...state,
        tempLabel: action.payload.tempLabel
      };
    case '/LABELS/CREATE_LABEL':
      return {
        ...state,
        labels: [action.payload.label, ...state.labels],
        pagination: {
          ...state.pagination,
          count: state.pagination.count + 1
        }
      };
    case '/LABELS/CHANGE_LABEL':
      return {
        ...state,
        labels: state.labels.map((label) => {
          if (label._id === action.payload.label._id) {
            return action.payload.label;
          }
          return label;
        })
      };
    case '/LABELS/DELETE_LABEL':
      return {
        ...state,
        labels: state.labels.filter((label: any) => label._id !== action.payload.id),
        pagination: {
          ...state.pagination,
          count: state.pagination.count - 1
        }
      };
    case '/LABELS/LOAD_LABELS':
      return {
        ...state,
        labels: action.payload.labels,
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
