import {connectRouter} from 'connected-react-router';
import {combineReducers} from 'redux';
import {alertsReducer} from './alerts.reducer';
import {carriersReducer} from './carriers.reducer';
import {carsReducer} from './cars.reducer';
import {companiesReducer} from './companies.reducer';
import {dashboardReducer} from './dashboard.reducer';
import {inventoriesReducer} from './inventory.reducer';
import {inventoriesDashboardReducer} from './inventoryDashboard.reducer';
import {labelsReducer} from './labels.reducer';
import {modalReducer} from './modal.reducer';
import {usersReducer} from './users.reducer';
import {venuesReducer} from './venues.reducer';
import {dashboardDamagesReducer} from "./dashboardDamages.reducer";
import {dashboardTimingReducer} from "./dashboardTiming.reducer";
import {dashboardDercoReducer} from "./dashboardDerco.reducer";
import {versionsReducer} from "./versions.reducer";
import {requestsReducers} from "./requests.reducer";
import {planningReducer} from "./planning.reducer";
import {billingReducer} from "./billing.reducers";
import {regionsReducer} from "./regions.reducer";
import {stockReducer} from "./stock.reducer";
import { reducer as formReducer } from 'redux-form'

export default (history: any) => combineReducers({
  users: usersReducer,
  cars: carsReducer,
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
  versions: versionsReducer,
  venues: venuesReducer,
  companies: companiesReducer,
  labels: labelsReducer,
  requests: requestsReducers,
  regions: regionsReducer,
  stock: stockReducer,
  planning: planningReducer,
  form: formReducer,
  router: connectRouter(history)
});
