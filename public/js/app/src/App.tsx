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
import RequestChannelListView from './components/RequestSettings/RequestChannelListView';
import PaymentMethodListView from './components/RequestSettings/PaymentMethodlListView';
import RequestStatusListView from './components/RequestSettings/RequestStatusListView';
import CompaniesListView from './components/Companies/CompaniesListView';
import DashboardDamagesView from './components/DashboardGeneral/DashboardDamagesView';
import DashboardDercoView from './components/DashboardGeneral/DashboardDercoView';
import DashboardGeneralView from './components/DashboardGeneral/DashboardGeneralView';
import DashboardTimingView from './components/DashboardGeneral/DashboardTimingView';
import DashboardRevisionsView from './components/DashboardVin/DashboardRevisionsView';
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
import RequestReasonListView from './components/RequestSettings/RequestReasonListView';
import RegionsListView from './components/Region/RegionsListFiew';
import RequestCreateView from './components/Request/RequestCreateView';
import RequestDetailView from './components/Request/RequestDetail/RequestDetailView';
import RequestListView from './components/Request/RequestList/RequestListView';
import RequestUpdaterView from './components/Request/RequestUpdaterView';
import RequestVehicleListView from './components/Request/RequestVehicleList/RequestVehicleListView';
import StockImportView from './components/Stock/StockImportView';
import StockView from './components/Stock/StockListView';
import UsersListView from './components/Users/UserListView';
import VenuesListView from './components/Venues/VenuesListView';
import VersionListView from './components/Versions/VersionListView';
import IntegrationListView from "./components/Integration/IntegrationListView";
import { IWindow } from './interfaces/window';
import configureStore, { history } from './store/configureStore';
import { isIntenertExplorer } from './utils/common';
import CustomDashboardComponent from './components/CustomDashboard/CustomDashboardComponent';
import TransmittalListView from './components/Transmittal/TransmittalList/TransmittalListView';
import TransmittalCreateView from './components/Transmittal/TransmittalCreateView';
import OperationTypeListView from './components/RequestSettings/OperationTypeListView';
import RequestImportView from './components/Request/RequestImportView';
import RequestImportVINSView from './components/Request/RequestImportVINSView';
import MilestoneListView from './components/RequestSettings/MilestoneListView';
import MilestoneTypeListView from './components/RequestSettings/MilestoneTypeListView';
import FormsSettingsListView from './components/FormsSettings/FormListView';
import RequestCreateIntegration from './components/Request/RequestCreateIntegration';
import ColorListView from './components/Colors/ColorsListView';
import {
  VDistributionDashboardStatsView, VInventoryDashboardStatsView, VPlanificationDashboardStatsView,
  VUnitControlDashboardStatsView
} from "./components/Stats/DashboardStatsView";
import DashboardStatsListView from "./components/Stats/DashboardStatsListView";
import DashboardView from "./components/Transmittal/StatsDashboard/DashboardView";
import BordersListView from "./components/Borders/BordersListView";
import BillingSettingsListView from './components/Billing/BillingSettings/BillingSettingsListView';
import BillingCoporateListView from './components/Billing/BillingSettings/BillingCorporateDetailView';
import DeliveriesView from './components/Deliveries/DeliveriesView';
import * as ReactGA from 'react-ga';


declare let window: IWindow;

const store = configureStore();

const NoMatch = ({ location }: RouteComponentProps<{}>) => (
  <div>
    <h3>No match for <code>{location.pathname}</code></h3>
  </div>
);
const App = () => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Switch>
        <Route exact path="/settings/integrations/" component={IntegrationListView}/>
        <Route exact path='/' component={DashboardGeneralView} />
        <Route exact path='/revision-report/' component={DashboardRevisionsView} />
        <Route exact path='/cars/' component={DashboardVinView} />
        <Route exact path='/deliveries/' component={DeliveriesView} />
        <Route exact path='/planning/import/' component={PlanningImportView} />
        <Route exact path='/planning/studio/' component={VPlanificationDashboardStatsView} />
        <Route exact path='/planning/' component={PlanningListView} />
        <Route exact path='/dashboard/damages/' component={DashboardDamagesView} />
        <Route exact path='/dashboard/timing/' component={DashboardTimingView} />
        <Route exact path='/dashboard/derco/' component={DashboardDercoView} />
        <Route exact path='/dashboard/studio/' component={VUnitControlDashboardStatsView}  />
        <Route exact path='/dashboard/custom-dashboard/' component={CustomDashboardComponent} />
        <Route exact path='/forms/settings/forms/' component={FormsSettingsListView} />
        <Route exact path='/stock/' component={StockView} />
        <Route exact path='/stock/import/' component={StockImportView} />
        <Route exact path='/cars/:id/' component={DashboardVinDetail} />
        <Route exact path='/deliveries/cars/:id/' component={DashboardVinDetail} />
        <Route exact path='/inventory/' component={InventoryListView} />
        <Route exact path='/inventory/studio/' component={VInventoryDashboardStatsView} />
        <Route exact path='/inventory/dashboard/' component={InventoryDashboardView} />
        <Route exact path='/inventory/create/' component={InventoryCreateView} />
        <Route exact path='/inventory/:id/' component={InventoryDetailView} />
        <Route exact path='/inventory/:id/:tab/' component={InventoryDetailView} />
        <Route exact path='/settings/users/' component={UsersListView} />
        <Route exact path='/settings/cars/' component={CarsListView} />
        <Route exact path='/settings/cars/import/' component={ImportCarsView} />
        <Route exact path='/settings/cars/:id/' component={CarDetailView} />
        <Route exact path='/settings/labels/' component={LabelsListView} />
        <Route exact path='/settings/venues/' component={VenuesListView} />
        <Route exact path='/settings/regions/' component={RegionsListView} />
        <Route exact path='/settings/colors/' component={ColorListView} />
        <Route exact path='/settings/carriers/' component={CarriersListView} />
        <Route exact path='/settings/companies/' component={CompaniesListView} />
        <Route exact path='/settings/alerts/' component={AlertsViews} />
        <Route exact path='/settings/versions/' component={VersionListView} />
        <Route exact path='/settings/billing-settings/' component={BillingSettingsListView} />
        <Route exact path='/settings/billing/corporate/' component={BillingCoporateListView} />
        <Route exact path='/settings/billing/' component={BillingListView} />
        <Route exact path='/settings/billing/' component={BillingListView} />
        <Route exact path='/settings/stats/' component={DashboardStatsListView} />
        <Route exact path='/settings/border/' component={BordersListView} />
        <Route exact path='/requests/create/' component={RequestCreateView} />
        <Route exact path='/transmittals/' component={TransmittalListView} />
        <Route exact path='/transmittals/create/' component={TransmittalCreateView} />
        <Route exact path='/transmittals/dashboard/' component={DashboardView} />
        <Route exact path='/requests/' component={RequestListView} />
        <Route exact path='/requests/settings/reasons/' component={RequestReasonListView} />
        <Route exact path='/requests/settings/channels/' component={RequestChannelListView} />
        <Route exact path='/requests/settings/payment-methods/' component={PaymentMethodListView} />
        <Route exact path='/requests/settings/status/' component={RequestStatusListView} />
        <Route exact path='/requests/settings/operations-type/' component={OperationTypeListView} />
        <Route exact path='/transmittals/settings/milestone/' component={MilestoneListView} />
        <Route exact path='/transmittals/settings/milestone-type/' component={MilestoneTypeListView} />
        <Route exact path='/requests/import/' component={RequestImportView} />
        <Route exact path='/requests/mass-allocation/' component={RequestImportVINSView} />
        <Route exact path='/requests/update/' component={RequestUpdaterView} />
        <Route exact path='/requests/studio/' component={VDistributionDashboardStatsView} />
        <Route exact path='/requests/vehicles/external/create/' component={RequestCreateIntegration} />
        <Route exact path='/requests/vehicles/create' component={RequestCreateView} />
        <Route exact path='/requests/vehicles/:id/' component={RequestDetailView} />
        <Route exact path='/requests/vehicles/' component={RequestVehicleListView} />
        <Route exact path='/requests/:id/' component={RequestDetailView} />
        <Route component={NoMatch} />
      </Switch>
    </ConnectedRouter>
  </Provider>
);
const $body = $('body');
// clear state of the modeal on hidden
$body.on('hidden.bs.modal', '#andesModal', () => {
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
  ReactGA.initialize('UA-101792436-1', {
    debug: false,
    titleCase: false,
    gaOptions: {
      userId: window.user._id,
      clientId: window.user.email,
      name: 'tracker'
    }
  });
  ReactDOM.render(
    <App />,
    document.querySelector('#app')
  );
  ($('.sidebar-menu') as any).tree();
  $body.on('click', '.treeview-menu li', () => {
    $body.removeClass('sidebar-open');
  });
  // ekk-lightbox
  $(document).on('click', '[data-toggle="lightbox"]', function(event) {
    event.preventDefault();
    ($(this) as any).ekkoLightbox();
  });
  // fix ekk-lightbox
  $(document).on('hidden.bs.modal', () => {
    if ($('.modal:visible').length) {
      $body.addClass('modal-open');
    }
  });

  $(document).on('click.bs.dropdown.data-api', '.dropdown.keep-inside-clicks-open', function(event) {
    event.stopPropagation();
  });
  // prevenet show modal addons when is open and user change page
  window.addEventListener('popstate', function() {
    $('.modal-backdrop').remove();
    $body.removeClass('modal-open');
    // ($('#andesModal') as any).modal('hide');
  });


  ($ as any).AdminLTESidebarTweak = {};

  ($ as any).AdminLTESidebarTweak.options = {
    EnableRemember: true,
    NoTransitionAfterReload: true
    //Removes the transition after page reload.
  };

  $(function() {
    'use strict';
    $body.on('collapsed.pushMenu', function() {
      if (($ as any).AdminLTESidebarTweak.options.EnableRemember) {
        localStorage.setItem('toggleState', 'closed');
      }
    });

    $body.on('expanded.pushMenu', function() {
      if (($ as any).AdminLTESidebarTweak.options.EnableRemember) {
        localStorage.setItem('toggleState', 'opened');
      }
    });
    // $('.sidebar-menu a').on('click', function() {
    //   const toggleState = localStorage.getItem('toggleState');
    //   console.log(toggleState);
    //   if(toggleState === 'closed'){
    //     localStorage.setItem('toggleState', 'closed');
    //     $body.addClass('sidebar-collapse');
    //   }
    // });

    if (($ as any).AdminLTESidebarTweak.options.EnableRemember) {
      const toggleState = localStorage.getItem('toggleState');
      if (toggleState === 'closed') {
        if (($ as any).AdminLTESidebarTweak.options.NoTransitionAfterReload) {
          $body.addClass('sidebar-collapse hold-transition').delay(100).queue(function() {
            $(this).removeClass('hold-transition');
          });
        } else {
          $body.addClass('sidebar-collapse');
        }
      }
    }
  });
});

if (process.env.NODE_ENV !== 'development') {
  // disable react debug
  if (window.hasOwnProperty('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__._renderers = {};
  }
}
