// import * as createRavenMiddleware from 'raven-for-redux';
// import * as Raven from 'raven-js';
import {applyMiddleware, createStore} from 'redux';
import createDebounce from 'redux-debounced';
import {composeWithDevTools} from 'redux-devtools-extension';
import LogerMiddleware from 'redux-logger';
import ThunkMiddleware from 'redux-thunk';
// import {IWindow} from '../interfaces/window';
import rootReducer from '../reducers/';

// declare let window: IWindow;

const configureStore = () => {
  let enhancers: any;
  const middlewares: any[] = [];

  if (process.env.NODE_ENV === 'development') {
    middlewares.push(ThunkMiddleware);
    middlewares.push(LogerMiddleware);
    middlewares.push(createDebounce());
    enhancers = composeWithDevTools(applyMiddleware(...middlewares));
  } else {
    middlewares.push(ThunkMiddleware);
    middlewares.push(createDebounce());
    // Raven.config(window.sentry_dns !== 'False' ? window.sentry_dns : 'https://fc4ef58ac7cc44b88c76d2a24948a8ca@sentry.gonzalomunoz.io/2').install();
    // Raven.setUserContext({
    //     id: window.user.id,
    //     name: window.user.firstName,
    //     teamID: window.user.teamID,
    //     teamName: window.user.teamName,
    //     email: window.user.email
    // });
    // Raven.setTagsContext({
    //     environment: process.env.NODE_ENV
    // });
    // Raven.setExtraContext({
    //     app: 'Soporte'
    // });
    // middlewares.push(createRavenMiddleware(Raven));
    enhancers = applyMiddleware(...middlewares);
  }

  return createStore(rootReducer, enhancers);
};

export default configureStore;
