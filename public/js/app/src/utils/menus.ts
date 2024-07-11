import { IWindow } from '../interfaces/window';
import { hasPermission, parseReplicableURL } from './common';

declare let window: IWindow;

const menus: any[] = [];

/* *****************
 * 1. Dashboard
 *****************/
const dashboardItems = [
  {
    id: '1.1',
    icon: 'fa-circle-o',
    text: 'General',
    url: '/'
  }
];

if (hasPermission(window.user, 'viewCar')) {
  dashboardItems.push({
    id: '1.0',
    icon: 'fa-circle-o text-green',
    text: 'Unidades',
    url: '/settings/cars/'
  });
}

dashboardItems.push({
  id: '1.2',
  icon: 'fa-circle-o text-red',
  text: 'Revisiones',
  url: '/cars/'
});

dashboardItems.push({
  id: '1.8',
  icon: 'fa-circle-o text-blue',
  text: 'Entregas',
  url: '/deliveries/'
});

if (hasPermission(window.user, 'viewChecklistStudio')) {
  dashboardItems.push({
    id: '1.7',
    icon: 'fa-circle-o text-yellow',
    text: 'Análisis',
    url: '/dashboard/studio/'
  });
}

// dashboardItems.push({
//   id: '1.3',
//   icon: 'fa-circle-o',
//   text: 'Reporte revisiones',
//   url: '/revision-report/'
// });

if (
  process.env.NODE_ENV !== 'development' &&
  hasPermission(window.user, 'viewDashboardDamages')
) {
  dashboardItems.push({
    id: '1.4',
    icon: 'fa-circle-o',
    text: 'Daños',
    url: '/dashboard/damages/'
  });
}

if (
  process.env.NODE_ENV !== 'development' &&
  hasPermission(window.user, 'viewDashboardTiming')
) {
  dashboardItems.push({
    id: '1.5',
    icon: 'fa-circle-o',
    text: 'Tiempos de traslado',
    url: '/dashboard/timing/'
  });
}

if (hasPermission(window.user, 'viewDashboardDerco')) {
  dashboardItems.push({
    id: '1.6',
    icon: 'fa-circle-o',
    text: 'Derco',
    url: '/dashboard/derco/'
  });
}

if (window.user.isAdmin) {
  dashboardItems.push({
    id: '1.10',
    icon: 'fa-circle-o',
    text: 'Ajustes de control',
    url: '/forms/settings/forms/'
  });
}

if (dashboardItems.length) {
  menus.push({
    id: '1',
    text: 'Control Unidades',
    icon: 'fa-dashboard',
    url: dashboardItems[0].url,
    items: dashboardItems
  });
}

/* *****************
 * 2. Inventory
 *****************/
const inventoryItems = [];

if (hasPermission(window.user, 'viewInventoryDashboard')) {
  inventoryItems.push({
    id: '2.3',
    icon: 'fa-circle-o text-blue',
    text: 'Dashboard',
    url: '/inventory/dashboard/'
  });
}

if (hasPermission(window.user, 'currentStock')) {
  inventoryItems.push({
    id: '2.4',
    icon: 'fa-circle-o text-green',
    text: 'Stock Actual',
    url: '/stock/'
  });
}

if (hasPermission(window.user, 'viewInventory')) {
  inventoryItems.push({
    id: '2.1',
    icon: 'fa-circle-o text-red',
    text: 'Gestión',
    url: '/inventory/'
  });
}

if (hasPermission(window.user, 'viewInventoryStudio')) {
  inventoryItems.push({
    id: '2.5',
    icon: 'fa-circle-o text-yellow',
    text: 'Análisis',
    url: '/inventory/studio/'
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

if (hasPermission(window.user, 'viewInventory')) {
  inventoryItems.push({
    id: '2.6',
    icon: 'fa-circle-o',
    text: 'Revisión Containers',
    url: '/inventory/containers/'
  });
}

if (inventoryItems.length) {
  menus.push({
    id: '2',
    text: 'Inventario',
    icon: 'fa-book',
    url: inventoryItems[0].url,
    items: inventoryItems
  });
}

/* *****************
 * 3. Anteojos
 *****************/
const anteojosItems = [];

if (hasPermission(window.user, 'viewTraceability')) {
  anteojosItems.push({
    id: '3.1',
    icon: 'fa-circle-o text-green',
    text: 'Control',
    url: '/osa/studio/'
  });
}

if (hasPermission(window.user, 'viewTraceability')) {
  anteojosItems.push({
    id: '3.2',
    icon: 'fa-circle-o text-green',
    text: 'OSA',
    url: '/osa/'
  });
}

// if (hasPermission(window.user, 'viewTraceability')) {
//   anteojosItems.push({
//     id: '3.3',
//     icon: 'fa-circle-o text-green',
//     text: 'Control',
//     url: '/control/'
//   });
// }

if (anteojosItems.length) {
  menus.push({
    id: '3',
    text: 'Anteojos',
    icon: 'fa-search',
    url: anteojosItems[0].url,
    items: anteojosItems
  });
}

/* *****************
 * 4. Request and Distribution
 *****************/
const distributionItems = [];

if (hasPermission(window.user, 'viewRequest')) {
  distributionItems.push({
    id: '4.1',
    icon: 'fa-circle-o text-green',
    text: 'Solicitudes',
    url: parseReplicableURL('/requests/')
  });
}

if (hasPermission(window.user, 'viewRequest')) {
  distributionItems.push({
    id: '4.2',
    icon: 'fa-circle-o text-red',
    text: 'Unidades',
    url: parseReplicableURL('/requests/vehicles/')
  });
}

if (hasPermission(window.user, 'viewTransmittal')) {
  distributionItems.push({
    id: '4.4',
    icon: 'fa-circle-o text-blue',
    text: 'Transportes',
    url: parseReplicableURL('/transmittals/')
  });
}

if (hasPermission(window.user, 'viewDistributionStudio')) {
  distributionItems.push({
    id: '4.5',
    icon: 'fa-circle-o text-yellow',
    text: 'Análisis',
    url: '/requests/studio/'
  });
}

if (hasPermission(window.user, 'adminRequest')) {
  distributionItems.push({
    id: '4.3',
    icon: 'fa-circle-o',
    text: 'Ajustes',
    url: parseReplicableURL('/requests/settings/reasons/')
  });
}

if (hasPermission(window.user, 'transmittalDashboard')) {
  distributionItems.push({
    id: '4.6',
    icon: 'fa-circle-o',
    text: 'Dashboard',
    url: parseReplicableURL('/transmittals/dashboard/')
  });
}

if (distributionItems.length) {
  menus.push({
    id: '4',
    text: 'Distribución',
    icon: 'fa-cubes',
    url: distributionItems[0].url,
    items: distributionItems
  });
}

/* *****************
 * 5. Planning
 *****************/
const planningItems = [];
if (hasPermission(window.user, 'viewPlanning')) {
  planningItems.push({
    id: '5.1',
    icon: 'fa-circle-o',
    text: 'Detalle',
    url: '/planning/'
  });
}

if (hasPermission(window.user, 'viewPlanning')) {
  planningItems.push({
    id: '5.2',
    icon: 'fa-circle-o',
    text: 'Importar',
    url: '/planning/import/'
  });
}

// if (hasPermission(window.user, 'viewPlanificationStudio')) {
//   planningItems.push({
//     id: '4.3',
//     icon: 'fa-circle-o',
//     text: 'Análisis',
//     url: '/planning/studio/'
//   });
// }

if (process.env.NODE_ENV !== 'development' && planningItems.length) {
  menus.push({
    id: '5',
    text: 'Planificación',
    icon: 'fa-calendar-check-o',
    url: '/planning/',
    items: planningItems
  });
}

/* *****************
 * 10. Settings
 *****************/
const settingItems = [
  /*{
  id: '10.1',
  icon: 'fa-circle-o',
  text: 'Alertas',
  url: '/settings/alerts/'
}*/
];

if (hasPermission(window.user, 'viewCompany') && window.user.isAdmin) {
  settingItems.push({
    id: '10.1',
    icon: 'fa-circle-o text-yellow',
    text: 'Empresas',
    url: '/settings/companies/'
  });
}


if (hasPermission(window.user, 'viewVenue')) {
  settingItems.push({
    id: '10.4',
    icon: 'fa-circle-o text-red',
    text: 'Sucursales',
    url: '/settings/venues/'
  });
}

if (hasPermission(window.user, 'viewUser')) {
  settingItems.push({
    id: '10.5',
    icon: 'fa-circle-o text-green',
    text: 'Usuarios',
    url: '/settings/users/'
  });
}


if (hasPermission(window.user, 'viewCarrier')) {
  settingItems.push({
    id: '10.6',
    icon: 'fa-circle-o  text-blue',
    text: 'Transportistas',
    url: '/settings/carriers/'
  });
}
if (hasPermission(window.user, 'viewVenue')) {
  settingItems.push({
    id: '10.9',
    icon: 'fa-circle-o',
    text: 'Regiones',
    url: '/settings/regions/'
  });
}

if (hasPermission(window.user, 'viewColor')) {
  settingItems.push({
    id: '10.10',
    icon: 'fa-circle-o',
    text: 'Colores',
    url: '/settings/colors/'
  });
}

if (hasPermission(window.user, 'viewBorder')) {
  settingItems.push({
    id: '10.11',
    icon: 'fa-circle-o',
    text: 'Pórticos',
    url: '/settings/border/'
  });
}

if (settingItems.length) {
  menus.push({
    id: '10',
    text: 'Configuración',
    icon: `fa-cog`,
    // ${process.env.NODE_ENV === 'development' ? 'text-yellow' : ''}
    url: settingItems[0].url,
    items: settingItems
  });
}

/* *****************
 * 1001. Información
 *****************/
const AdminItems: any[] = [];

if (window.user.isAdmin) {
  AdminItems.push({
    id: '200.21',
    icon: 'fa-circle-o text-blue',
    text: 'Settings',
    url: '/settings/billing-settings/'
  });
}

// if (hasPermission(window.user, 'viewCompany') && window.user.isAdmin) {
//   AdminItems.push({
//     id: '200.0',
//     icon: 'fa-circle-o text-red',
//     text: 'Empresas',
//     url: '/settings/companies/'
//   });
// }

if (hasPermission(window.user, 'viewBilling') && window.user.isAdmin) {
  AdminItems.push({
    id: '200.4',
    icon: 'fa-circle-o text-green',
    text: 'Billing Corporativo',
    url: '/settings/billing/corporate/'
  });
}

if (hasPermission(window.user, 'viewIntegration') && window.user.isAdmin) {
  AdminItems.push({
    id: '200.1',
    icon: 'fa-circle-o text-yellow',
    text: 'Integraciones',
    url: '/settings/integrations/'
  });
}

if (hasPermission(window.user, 'viewBilling') && window.user.isAdmin) {
  AdminItems.push({
    id: '200.2',
    icon: 'fa-circle-o',
    text: 'Billing',
    url: '/settings/billing/'
  });
}

if (hasPermission(window.user, 'viewStatsDashboard') && window.user.isAdmin) {
  AdminItems.push({
    id: '200.3',
    icon: 'fa-circle-o',
    text: 'Estádisticas',
    url: '/settings/stats/'
  });
}

if (AdminItems.length && window.user.isAdmin) {
  menus.push({
    id: '200',
    text: 'Administrador',
    icon: `fa-check-square text-red`,
    url: '/settings/integrations/',
    items: AdminItems
  });
}

if (hasPermission(window.user, 'viewVersion') && window.user.isAdmin) {
  AdminItems.push({
    id: '200.100',
    icon: 'fa-circle-o',
    text: 'Versiones',
    url: '/settings/versions/'
  });
}

export default menus;
