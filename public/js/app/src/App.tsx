import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, RouteComponentProps, Router as BrowserRouter, Switch } from 'react-router-dom';
import configureStore from './store/configureStore';
import history from './utils/history';
import TestDetailView2 from "./components/TestDetail/TestDetailView2";
import UsersListView from "./components/Users/UsersListView";
import * as moment from 'moment';
import DashboardVinView from "./components/DashboardVin/DashboardVinView";
import DashboardVinDetail from "./components/DashboardVin/DashboardVinDetail";
import DashboardGeneralView from "./components/DashboardGeneral/DashboardGeneralView";

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
                <Route exact path="/2/" component={ TestDetailView2 }/>
                <Route exact path="/users/" component={ UsersListView }/>
                {/*<Route exact path="/ticket/create/" component={ TicketCreateView }/>*/}
                {/*<Route exact path="/ticket/:ticket/" component={ TicketDetailView }/>*/}
                <Route component={ NoMatch }/>
            </Switch>
        </BrowserRouter>
    </Provider>
);

// clear state of the modeal on hidden
$('body').on('hidden.bs.modal', '#andesModal', function (e) {
  store.dispatch({type: '/MODAL/CLEAR'});
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
});

