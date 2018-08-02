import { combineReducers } from 'redux';
import { alerts } from './alerts';
import { cars } from './cars';
import { dashboard } from './dashboard';
import { modal } from './modal';
import { users } from './users';

export default combineReducers({
  users,
  cars,
  modal,
  dashboard,
  alerts
});
