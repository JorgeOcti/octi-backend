import { routerMiddleware } from 'connected-react-router';
import * as createRavenMiddleware from 'raven-for-redux';
import * as Raven from 'raven-js';
import {applyMiddleware, createStore} from 'redux';
import createDebounce from 'redux-debounced';
import {composeWithDevTools} from 'redux-devtools-extension';
// import LogerMiddleware from 'redux-logger';
import ThunkMiddleware from 'redux-thunk';
import {IWindow} from '../interfaces/window';
import createRootReducer from '../reducers/index.reducer';
import browserHistort from '../utils/history';

declare let window: IWindow;

export const history = browserHistort;

const configureStore = () => {
  let enhancers: any;
  const middlewares: any[] = [routerMiddleware(history)];

  if (process.env.NODE_ENV === 'development') {
    middlewares.push(ThunkMiddleware);
    // middlewares.push(LogerMiddleware);
    middlewares.push(createDebounce());
    const composeEnhancers = composeWithDevTools({trace: true, traceLimit: 10 });
    enhancers = composeEnhancers(applyMiddleware(...middlewares));
  } else {
    middlewares.push(ThunkMiddleware);
    middlewares.push(createDebounce());
    Raven.config('https://0420e8358aae4b1f91e2d0b234eddebd@sentry.osacontrol.com/17').install();
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

  return createStore(createRootReducer(history), enhancers);
};

export default configureStore;
