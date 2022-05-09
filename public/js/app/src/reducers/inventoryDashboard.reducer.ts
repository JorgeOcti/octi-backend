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
  inventorySettings: {
    report: null,
    leftoverDifferentVenue: false,
    pending: "",
    pendingClass: "aqua",
    pendingColor: "",
    found: "",
    foundClass: "green",
    foundColor: "",
    missing: "",
    missingClass: "red",
    missingColor: "",
    leftover: "",
    leftoverClass: "yellow",
    leftoverColor: "",
    reported: "",
    reportedClass: "gray-dark",
    reportedColor: ""
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
        inventorySettings: action.payload.inventorySettings,
        monthlyReport: action.payload.monthlyReport
      };
    case '/INVENTORY_DASHBOARD/LOAD_DATA_FILTERED':
      return {
        ...state,
        inventorySettings: action.payload.inventorySettings,
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
