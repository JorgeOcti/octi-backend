import { connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import { alertsReducer } from './alerts.reducer';
import { billingReducer } from './billing.reducers';
import { carriersReducer } from './carriers.reducer';
import { carsReducer } from './cars.reducer';
import { companiesReducer } from './companies.reducer';
import { dashboardReducer } from './dashboard.reducer';
import { dashboardDamagesReducer } from './dashboardDamages.reducer';
import { dashboardDercoReducer } from './dashboardDerco.reducer';
import { dashboardTimingReducer } from './dashboardTiming.reducer';
import { inventoriesReducer } from './inventory.reducer';
import { inventoriesDashboardReducer } from './inventoryDashboard.reducer';
import { labelsReducer } from './labels.reducer';
import { modalReducer } from './modal.reducer';
import { planningReducer } from './planning.reducer';
import { reasonsReducers } from './reasons.reducer';
import { regionsReducer } from './regions.reducer';
import { requestItemsReducers } from './requestItems.reducer';
import { requestsReducers } from './requests.reducer';
import { stockReducer } from './stock.reducer';
import { usersReducer } from './users.reducer';
import { requestStatusReducer } from './requestStatus.reducer';
import { requestChannelReducer } from './requestChannel.reducer';
import { venuesReducer } from './venues.reducer';
import { versionsReducer } from './versions.reducer';
import transmittalReducer from "./transmittal.reducer";
import { operationTypeReducer } from './operationType.reducer';

export default (history: any) => combineReducers({
  users: usersReducer,
  cars: carsReducer,
  transmittal: transmittalReducer,
  modal: modalReducer,
  carriers: carriersReducer,
  dashboard: dashboardReducer,
  dashboardDamages: dashboardDamagesReducer,
  dashboardTiming: dashboardTimingReducer,
  billing: billingReducer,
  dashboardDerco: dashboardDercoReducer,
  inventories: inventoriesReducer,
  inventoryDashboard: inventoriesDashboardReducer,
  alerts: alertsReducer,
  reasons: reasonsReducers,
  versions: versionsReducer,
  requestStatus: requestStatusReducer,
  requestChannel: requestChannelReducer,
  venues: venuesReducer,
  companies: companiesReducer,
  labels: labelsReducer,
  requests: requestsReducers,
  requestItems: requestItemsReducers,
  operationType: operationTypeReducer,
  regions: regionsReducer,
  stock: stockReducer,
  planning: planningReducer,
  form: formReducer,
  router: connectRouter(history)
});
