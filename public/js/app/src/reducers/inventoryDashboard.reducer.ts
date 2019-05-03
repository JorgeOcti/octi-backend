import {
  IInventoryDashboardState,
  InventoryDashboardReduxAction
} from '../actions/inventoryDashboard.actions';

const initialState: IInventoryDashboardState = {
  filter: {
    text: '',
    property: '',
    type: '',
    venues: [],
    states: []
  },
  venues: [],
  monthlyReport: [],
  loading: true
};

export function inventoriesDashboardReducer(state = initialState, action: InventoryDashboardReduxAction): IInventoryDashboardState {
  switch (action.type) {
    case '/INVENTORY_DASHBOARD/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/INVENTORY_DASHBOARD/LOAD_DATA':
      return {
        ...state,
        loading: false,
        venues: action.payload.venues,
        monthlyReport: action.payload.monthlyReport
      };
    case '/INVENTORY_DASHBOARD/LOAD_DATA_FILTERED':
      return {
        ...state,
        filter: {
          ...action.payload.filter,
          venues: action.payload.filter.venues,
        },
        monthlyReport: action.payload.monthlyReport
      };
    default:
      return state;
  }
}
