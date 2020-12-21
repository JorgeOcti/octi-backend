import { ConnectedRouter } from 'connected-react-router';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import AlertsViews from './components/Alerts/AlertViews';
import BillingListView from './components/Billing/BillingListView';
import CarriersListView from './components/Carriers/CarriersListView';
import CarDetailView from './components/Cars/CarDetailView';
import CarsListView from './components/Cars/CarListView';
import CompaniesListView from './components/Companies/CompaniesListView';
import DashboardDamagesView from './components/DashboardGeneral/DashboardDamagesView';
import DashboardDercoView from './components/DashboardGeneral/DashboardDercoView';
import DashboardGeneralView from './components/DashboardGeneral/DashboardGeneralView';
import DashboardTimingView from './components/DashboardGeneral/DashboardTimingView';
import DashboardVinDetail from './components/DashboardVin/DashboardVinDetail';
import DashboardVinView from './components/DashboardVin/DashboardVinView';
import ImportCarsView from './components/Imports/ImportCarView';
import InventoryCreateView from './components/Inventory/InventoryCreateView';
import InventoryDashboardView from './components/Inventory/InventoryDashboardView';
import InventoryDetailView from './components/Inventory/InventoryDetailView';
import InventoryListView from './components/Inventory/InventoryListView';
import LabelsListView from './components/Labels/LabelsListView';
import PlanningImportView from './components/Planning/PlanningImportView';
import PlanningListView from './components/Planning/PlanningListView';
import RegionsListView from './components/Region/RegionsListFiew';
import RequestCreateView from './components/Request/RequestCreateView';
import RequestDetailView from './components/Request/RequestDetail/RequestDetailView';
import RequestListView from './components/Request/RequestList/RequestListView';
import RequestVehicleListView from './components/Request/RequestVehicleList/RequestVehicleListView';
import StockImportView from './components/Stock/StockImportView';
import StockView from './components/Stock/StockListView';
import UsersListView from './components/Users/UserListView';
import VenuesListView from './components/Venues/VenuesListView';
import VersionListView from './components/Versions/VersionListView';
import { IWindow } from './interfaces/window';
import configureStore, { history } from './store/configureStore';
import { isIntenertExplorer } from './utils/common';


declare let window: IWindow;

const store = configureStore();

const NoMatch = ({location}: RouteComponentProps<{}>) => (
  <div>
    <h3>No match for <code>{location.pathname}</code></h3>
  </div>
);
const App = () => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Switch>
        <Route exact path="/" component={DashboardGeneralView}/>
        <Route exact path="/cars/" component={DashboardVinView}/>
        <Route exact path="/planning/import/" component={PlanningImportView}/>
        <Route exact path="/planning/" component={PlanningListView}/>
        <Route exact path="/dashboard/damages/" component={DashboardDamagesView}/>
        <Route exact path="/dashboard/timing/" component={DashboardTimingView}/>
        <Route exact path="/dashboard/derco/" component={DashboardDercoView}/>
        <Route exact path="/stock/" component={StockView}/>
        <Route exact path="/stock/import/" component={StockImportView}/>
        <Route exact path="/cars/:id/" component={DashboardVinDetail}/>
        <Route exact path="/inventory/" component={InventoryListView}/>
        <Route exact path="/inventory/dashboard/" component={InventoryDashboardView}/>
        <Route exact path="/inventory/create/" component={InventoryCreateView}/>
        <Route exact path="/inventory/:id/" component={InventoryDetailView}/>
        <Route exact path="/inventory/:id/:tab/" component={InventoryDetailView}/>
        <Route exact path="/settings/users/" component={UsersListView}/>
        <Route exact path="/settings/cars/" component={CarsListView}/>
        <Route exact path="/settings/cars/import/" component={ImportCarsView}/>
        <Route exact path="/settings/cars/:id/" component={CarDetailView}/>
        <Route exact path="/settings/labels/" component={LabelsListView}/>
        <Route exact path="/settings/venues/" component={VenuesListView}/>
        <Route exact path="/settings/regions/" component={RegionsListView}/>
        <Route exact path="/settings/carriers/" component={CarriersListView}/>
        <Route exact path="/settings/companies/" component={CompaniesListView}/>
        <Route exact path="/settings/alerts/" component={AlertsViews}/>
        <Route exact path="/settings/billing/" component={BillingListView}/>
        <Route exact path="/settings/versions/" component={VersionListView}/>
        <Route exact path="/requests/create/" component={RequestCreateView}/>
        <Route exact path="/requests/" component={RequestListView}/>
        <Route exact path="/requests/vehicles/create" component={RequestCreateView}/>
        <Route exact path="/requests/vehicles/:id/" component={RequestDetailView}/>
        <Route exact path="/requests/vehicles/" component={RequestVehicleListView}/>
        <Route exact path="/requests/:id/" component={RequestDetailView}/>
        <Route component={NoMatch}/>
      </Switch>
    </ConnectedRouter>
  </Provider>
);

// clear state of the modeal on hidden
$('body').on('hidden.bs.modal', '#andesModal', () => {
  store.dispatch({
    type: '/MODAL/CLEAR'
  });
});

$(() => {
  // add ekko-lightbox
  const script = document.createElement('script');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = isIntenertExplorer() ? '/static/js/vendor/lightbox/ekko-lightbox.css' : '/static/js/vendor/lightbox/ekko-lightbox.last.css';
  const js = document.getElementsByClassName('js')[0];
  script.src = isIntenertExplorer() ? '/static/js/vendor/lightbox/ekko-lightbox.min.js' : '/static/js/vendor/lightbox/ekko-lightbox.last.min.js';
  js.appendChild(script);
  js.appendChild(link);

  moment.locale('es');
  ReactDOM.render(
      <App />,
      document.querySelector('#app')
  );
  ($('.sidebar-menu') as any).tree();
  $('body').on('click', '.treeview-menu li', () => {
    $('body').removeClass('sidebar-open');
  });
  // ekk-lightbox
  $(document).on('click', '[data-toggle="lightbox"]', function(event) {
    event.preventDefault();
    ($(this) as any).ekkoLightbox();
  });
  // fix ekk-lightbox
  $(document).on('hidden.bs.modal', () => {
    if ($('.modal:visible').length) {
      $('body').addClass('modal-open');
    }
  });

  $(document).on('click.bs.dropdown.data-api', '.dropdown.keep-inside-clicks-open', function(event) {
    event.stopPropagation();
  });
  // prevenet show modal addons when is open and user change page
  window.addEventListener('popstate', function(e){
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open');
    // ($('#andesModal') as any).modal('hide');
  });
});

if (process.env.NODE_ENV !== 'development') {
  // disable react debug
  if (window.hasOwnProperty('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__._renderers = {};
  }
}
