import * as createRavenMiddleware from 'raven-for-redux';
import * as Raven from 'raven-js';
import {applyMiddleware, createStore} from 'redux';
import createDebounce from 'redux-debounced';
import {composeWithDevTools} from 'redux-devtools-extension';
// import LogerMiddleware from 'redux-logger';
import ThunkMiddleware from 'redux-thunk';
import {IWindow} from '../interfaces/window';
import rootReducer from '../reducers/';

declare let window: IWindow;

const configureStore = () => {
  let enhancers: any;
  const middlewares: any[] = [];

  if (process.env.NODE_ENV === 'development') {
    middlewares.push(ThunkMiddleware);
    // middlewares.push(LogerMiddleware);
    middlewares.push(createDebounce());
    enhancers = composeWithDevTools(applyMiddleware(...middlewares));
  } else {
    middlewares.push(ThunkMiddleware);
    middlewares.push(createDebounce());
    Raven.config('https://7cb5eacf6f8249b888468a1b72bd7632@sentry.osacontrol.com/5').install();
    const context = {
        id: window.user._id,
        name: `${window.user.firstName} ${window.user.lastName}`,
        email: window.user.email
    };
    Raven.setUserContext(context);
    Raven.setTagsContext({
        environment: process.env.NODE_ENV
    });
    Raven.setExtraContext({
        app: 'Andes'
    });
    middlewares.push(createRavenMiddleware(Raven));
    enhancers = applyMiddleware(...middlewares);
  }

  return createStore(rootReducer, enhancers);
};

export default configureStore;
