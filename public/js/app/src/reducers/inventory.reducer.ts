import {IInventoryState, InventoryReduxAction} from '../actions/inventory.actions';

const initialState: IInventoryState = {
  inventories: [],
  loading: true,
  source: null,
  loadingDetail: true,
  summary: {
    _id: '',
    name: '',
    status: '',
    createdAt: null,
    finalizedAt: null
  },
  detail: null,
  detailByVenue: [],
  detailByBrand: [],
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function inventoriesReducer(state = initialState, action: InventoryReduxAction): IInventoryState {
  switch (action.type) {
    case '/INVENTORORIES/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/INVENTORORIES/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/INVENTORORIES/LOAD_DATA':
      return {
        ...state,
        inventories: action.payload.inventories
      };
    case '/INVENTORORIES/LOADING_INVENTORY_DETAIL':
      return {
        ...state,
        loadingDetail: action.payload.loadingDetail
      };
    case '/INVENTORORIES/LOAD_INVENTORY_DATA':
      return {
        ...state,
        summary: action.payload.summary,
        detailByVenue: action.payload.detailByVenue,
        detail: action.payload.detail,
        detailByBrand: action.payload.detailByBrand
      };
    default:
      return state;
  }
}
