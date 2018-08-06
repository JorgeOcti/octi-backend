import * as moment from 'moment';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, RouteComponentProps, Router as BrowserRouter, Switch } from 'react-router-dom';
import AlertsViews from './components/Alerts/AlertViews';
import CarsListView from './components/Cars/CarListView';
import DashboardGeneralView from './components/DashboardGeneral/DashboardGeneralView';
import DashboardVinDetail from './components/DashboardVin/DashboardVinDetail';
import DashboardVinView from './components/DashboardVin/DashboardVinView';
import ImportCarsView from './components/Imports/ImportCarView';
import UsersListView from './components/Users/UserListView';
import configureStore from './store/configureStore';
import history from './utils/history';

const store = configureStore();

const NoMatch = ({location}: RouteComponentProps<{}>) => (
  <div>
    <h3>No match for <code>{location.pathname}</code></h3>
  </div>
);

const App = () => (
    <Provider store={store}>
        <BrowserRouter history={history}>
            <Switch>
                <Route exact path="/" component={ DashboardGeneralView }/>
                <Route exact path="/cars/" component={ DashboardVinView }/>
                <Route exact path="/cars/:id" component={ DashboardVinDetail }/>
                <Route exact path="/settings/users/" component={ UsersListView }/>
                <Route exact path="/settings/cars/" component={ CarsListView }/>
                <Route exact path="/settings/cars/import/" component={ ImportCarsView }/>
                <Route exact path="/settings/alerts/" component={ AlertsViews }/>
                <Route component={ NoMatch }/>
            </Switch>
        </BrowserRouter>
    </Provider>
);

// clear state of the modeal on hidden
$('body').on('hidden.bs.modal', '#andesModal', () => {
  store.dispatch({
    type: '/MODAL/CLEAR'
  });
});

$(function() {
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
  $(document).on('hidden.bs.modal', function(event) {
    if ($('.modal:visible').length) {
      $('body').addClass('modal-open');
    }
  });
});

