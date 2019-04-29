import {
  IInventoryDashboardState,
  InventoryDashboardReduxAction,
} from '../actions/inventory_dashboard.actions';

const initialState: IInventoryDashboardState = {
  filter: {
    text: '',
    property: '',
    type: '',
    venues: [],
    states: []
  },
  venues: [],
  monthly_report: [],
  loading: true,
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
        monthly_report: action.payload.monthly_report
      };
    case '/INVENTORY_DASHBOARD/LOAD_DATA_FILTERED':
      return {
        ...state,
        filter: {
          ...action.payload.filter,
          venues: action.payload.filter.venues,
        },
        monthly_report: action.payload.monthly_report
      };
    default:
      return state;
  }
}
