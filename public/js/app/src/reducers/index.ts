import { combineReducers } from 'redux';
import { alerts } from './alerts';
import { dashboard } from './dashboard';
import { modal } from './modal';
import { users } from './users';

export default combineReducers({
  users,
  modal,
  dashboard,
  alerts
});
