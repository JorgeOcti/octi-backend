import {IWindow} from '../interfaces/window';
import {hasPermission} from './common';

declare let window: IWindow;

const menus: any[] = [];

/* ********
* Dashboard
***********/
const dashboardItems = [{
  id: '1.1',
  icon: 'fa-circle-o',
  text: 'General',
  url: '/'
}, {
  id: '1.2',
  icon: 'fa-circle-o',
  text: 'Listado de VINs',
  url: '/cars/'
}];

if (dashboardItems.length) {
  menus.push({
    id: '1',
    text: 'Dashboards',
    icon: 'fa-dashboard',
    url: '/',
    items: dashboardItems
  });
}

/* ********
* Settings
***********/
const settingItems = [{
  id: '2.1',
  icon: 'fa-circle-o',
  text: 'Alertas',
  url: '/settings/alerts/'
}];

if (hasPermission(window.user, 'viewCar')) {
  settingItems.push({
    id: '2.2',
    icon: 'fa-circle-o',
    text: 'Autos',
    url: '/settings/cars/'
  });
}
if (hasPermission(window.user, 'viewUser')) {
  settingItems.push({
    id: '2.3',
    icon: 'fa-circle-o',
    text: 'Usuarios',
    url: '/settings/users/'
  });
}

if (settingItems.length) {
  menus.push({
    id: '2',
    text: 'Settings',
    icon: 'fa-cog',
    url: '/settings/users/',
    items: settingItems
  });
}

export default menus;
