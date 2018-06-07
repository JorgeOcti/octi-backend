import { combineReducers } from 'redux';
import { users } from './users';
import { modal } from './modal';
import { dashboard } from './dashboard';

export default combineReducers({
  users,
  modal,
  dashboard
});
