import {IWindow} from '../interfaces/window';
import {hasPermission} from './common';

declare let window: IWindow;

const menus: any[] = [];

/* *****************
* 1. Dashboard
*****************/
const dashboardItems = [{
  id: '1.1',
  icon: 'fa-circle-o',
  text: 'General',
  url: '/'
}, {
  id: '1.2',
  icon: 'fa-circle-o',
  text: 'Revisiones',
  url: '/cars/'
}];

if (hasPermission(window.user, 'viewDashboardDamages')) {
  dashboardItems.push({
    id: '1.3',
    icon: 'fa-circle-o',
    text: 'Daños',
    url: '/dashboard/damages/'
  });
}

if (hasPermission(window.user, 'viewDashboardTiming')) {
  dashboardItems.push({
    id: '1.4',
    icon: 'fa-circle-o',
    text: 'Tiempos de traslado',
    url: '/dashboard/timing/'
  });
}

if (hasPermission(window.user, 'viewDashboardDerco')) {
  dashboardItems.push({
    id: '1.5',
    icon: 'fa-circle-o',
    text: 'Derco',
    url: '/dashboard/derco/'
  });
}

if (dashboardItems.length) {
  menus.push({
    id: '1',
    text: 'Dashboards',
    icon: 'fa-dashboard',
    url: '/',
    items: dashboardItems
  });
}

/* *****************
* 1. Inventory
*****************/
const inventoryItems = [];

if (hasPermission(window.user, 'viewInventoryDashboard')) {
  inventoryItems.push({
    id: '2.3',
    icon: 'fa-circle-o',
    text: 'Dashboard',
    url: '/inventory/dashboard/'
  });
}

if (hasPermission(window.user, 'viewInventory')) {
  inventoryItems.push({
    id: '2.1',
    icon: 'fa-circle-o',
    text: 'Gestión',
    url: '/inventory/'
  });
}

if (hasPermission(window.user, 'viewLabel')) {
  inventoryItems.push({
    id: '2.2',
    icon: 'fa-circle-o',
    text: 'Etiquetas',
    url: '/settings/labels/'
  });
}

if (inventoryItems.length) {
  menus.push({
    id: '2',
    text: 'Inventario',
    icon: 'fa-navicon',
    url: '/inventory/',
    items: inventoryItems
  });
}

/* *****************
* 10. Settings
*****************/
const settingItems = [{
  id: '10.1',
  icon: 'fa-circle-o',
  text: 'Alertas',
  url: '/settings/alerts/'
}];

if (hasPermission(window.user, 'viewCar')) {
  settingItems.push({
    id: '10.2',
    icon: 'fa-circle-o',
    text: 'Autos',
    url: '/settings/cars/'
  });
}

if (hasPermission(window.user, 'viewCompany')) {
  settingItems.push({
    id: '10.3',
    icon: 'fa-circle-o',
    text: 'Empresas',
    url: '/settings/companies/'
  });
}

if (hasPermission(window.user, 'viewVenue')) {
  settingItems.push({
    id: '10.4',
    icon: 'fa-circle-o',
    text: 'Sucursales',
    url: '/settings/venues/'
  });
}

if (hasPermission(window.user, 'viewCarrier')) {
  settingItems.push({
    id: '10.6',
    icon: 'fa-circle-o',
    text: 'Transportistas',
    url: '/settings/carriers/'
  });
}

if (hasPermission(window.user, 'viewUser')) {
  settingItems.push({
    id: '10.5',
    icon: 'fa-circle-o',
    text: 'Usuarios',
    url: '/settings/users/'
  });
}

if (settingItems.length) {
  menus.push({
    id: '10',
    text: 'Settings',
    icon: 'fa-cog',
    url: '/settings/users/',
    items: settingItems
  });
}

export default menus;
