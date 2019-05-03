import { connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';
import { alertsReducer } from './alerts.reducer';
import { carsReducer } from './cars.reducer';
import {companiesReducer} from './companies.reducer';
import { dashboardReducer } from './dashboard.reducer';
import { inventoriesReducer } from './inventory.reducer';
import { inventoriesDashboardReducer } from './inventoryDashboard.reducer';
import {labelsReducer} from './labels.reducer';
import { modalReducer } from './modal.reducer';
import { usersReducer } from './users.reducer';
import {venuesReducer} from './venues.reducer';

export default (history: any) => combineReducers({
  users: usersReducer,
  cars: carsReducer,
  modal: modalReducer,
  dashboard: dashboardReducer,
  inventories: inventoriesReducer,
  inventoryDashboard: inventoriesDashboardReducer,
  alerts: alertsReducer,
  venues: venuesReducer,
  companies: companiesReducer,
  labels: labelsReducer,
  router: connectRouter(history)
});
