import {
  IColorState,
  ColorReduxActions,
  COLOR_CANCEL,
  COLOR_CHANGE_ORDER,
  COLOR_IS_LOADING,
  COLOR_LOAD,
  COLOR_UDPATE, COLOR_CREATE, COLOR_DELETE
} from '../actions/color.types';

const initialState: IColorState = {
  colors: [],
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

export function colorsReducer(state = initialState, action: ColorReduxActions): IColorState {
  switch (action.type) {
    case COLOR_CANCEL:
      return {
        ...state,
        source: action.payload.source
      };
    case COLOR_IS_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };
    case COLOR_CHANGE_ORDER:
      return {
        ...state,
        options: {
          orderBy: action.payload.orderBy,
          orderType: action.payload.orderType
        }
      };
    case COLOR_CREATE:
      return {
        ...state,
        colors: [...state.colors, action.payload.color]
      };
     case COLOR_DELETE:
       return {
         ...state,
         colors: [...state.colors.filter((color) => color._id !== action.payload.color)]
       };
     case COLOR_UDPATE:
      return {
        ...state,
        colors: [...state.colors.map((color) => {
          if (color._id === action.payload.color._id) {
            return {
              color,
              ...action.payload.color
            };
          }
          return color;
        })]
      };

    case COLOR_LOAD:
      return {
        ...state,
        colors: action.payload.colors,
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
