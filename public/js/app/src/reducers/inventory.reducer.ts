import {IInventoryState, InventoryReduxAction} from '../actions/inventory.action';

const initialState: IInventoryState = {
  inventories: [],
  loading: true,
  source: null,
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
        inventories: action.payload.inventories,
      };
    default:
      return state;
  }
}
