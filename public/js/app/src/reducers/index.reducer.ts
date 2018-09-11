import { combineReducers } from 'redux';
import { alerts } from './alerts.reducer';
import { carsReducer } from './cars.reducer';
import { dashboardReducer } from './dashboard.reducer';
import { modalReducer } from './modal.reducer';
import { usersReducer } from './users.reducer';

export default combineReducers({
  users: usersReducer,
  cars: carsReducer,
  modal: modalReducer,
  dashboard: dashboardReducer,
  alerts
});
