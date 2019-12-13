import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import RequestController from './controllers/request.controller';
import ReasonController from './controllers/reason.controller';

const requestRouter = express.Router();


requestRouter.get('/requests/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/create/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/api/v1/requests/search-car/', Middlewares.isLoggedIn, RequestController.searhCar);
requestRouter.get('/api/v1/requests/', Middlewares.isLoggedIn, RequestController.apiList);
requestRouter.post('/api/v1/requests/', Middlewares.isLoggedIn, RequestController.apiCreate);

requestRouter.get('/api/v1/reasons/', Middlewares.isLoggedIn, ReasonController.apiList);

export {
  requestRouter
};
