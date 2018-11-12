import { combineReducers } from 'redux';
import { alertsReducer } from './alerts.reducer';
import { carsReducer } from './cars.reducer';
import { dashboardReducer } from './dashboard.reducer';
import { inventoriesReducer } from './inventory.reducer';
import { modalReducer } from './modal.reducer';
import { usersReducer } from './users.reducer';
import {venuesReducer} from './venues.reducer';

export default combineReducers({
  users: usersReducer,
  cars: carsReducer,
  modal: modalReducer,
  dashboard: dashboardReducer,
  inventories: inventoriesReducer,
  alerts: alertsReducer,
  venues: venuesReducer
});
