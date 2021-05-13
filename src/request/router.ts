import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import ReasonController from './controllers/reason.controller';
import SalesChannelController from './controllers/salesChannel.controller';
import RequestController from './controllers/request.controller';
import RequestItemStatusController from './controllers/requestItemStatus.controller';

const requestRouter = express.Router();

// web pages
requestRouter.get('/requests/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/settings/reasons/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/settings/channels/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/settings/status/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/export/', Middlewares.isLoggedIn, RequestController.exportExcel);
requestRouter.get('/requests/vehicles/:id/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/vehicles/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/:id/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/create/', Middlewares.isLoggedIn, RequestController.index);

// apis
requestRouter.get('/api/v1/requests/search-car/', Middlewares.isLoggedIn, RequestController.searhCar);
requestRouter.post('/api/v1/requests/upload-file/', Middlewares.isLoggedIn, RequestController.uploadFile);

requestRouter.post('/api/v1/requests/update-massive/', Middlewares.isLoggedIn, RequestController.apiUpdateMassive);

requestRouter.get('/api/v1/requests/', Middlewares.isLoggedIn, RequestController.apiList);
requestRouter.post('/api/v1/requests/', Middlewares.isLoggedIn, RequestController.apiCreate);
requestRouter.get('/api/v1/requests/:id/', Middlewares.isLoggedIn, RequestController.apiDetail);
requestRouter.delete('/api/v1/requests/:id/', Middlewares.isLoggedIn, RequestController.apiDeleteRequest);

requestRouter.post('/api/v1/requests-item/', Middlewares.isLoggedIn, RequestController.apiListItems);
requestRouter.post('/api/v1/add-requests-item/', Middlewares.isLoggedIn, RequestController.apiCreateItem);
requestRouter.patch('/api/v1/requests-item/:id/', Middlewares.isLoggedIn, RequestController.apiPatchItem);
requestRouter.delete('/api/v1/requests-item/:id/', Middlewares.isLoggedIn, RequestController.apiDeleteRequestItem);

requestRouter.get('/requests-item/:id/download-files/', Middlewares.isJWTAuthenticated, RequestController.downloadItemFiles);

requestRouter.get('/api/v1/reasons/', Middlewares.isLoggedIn, ReasonController.apiList);
requestRouter.post('/api/v1/reasons/', Middlewares.isLoggedIn, ReasonController.apiCreate);
requestRouter.patch('/api/v1/reasons/:id/', Middlewares.isLoggedIn, ReasonController.apiUpdate);
requestRouter.delete('/api/v1/reasons/:id/', Middlewares.isLoggedIn, ReasonController.apiDelete);

requestRouter.get('/api/v1/sales-channel/', Middlewares.isLoggedIn, SalesChannelController.apiList);
requestRouter.post('/api/v1/sales-channel/', Middlewares.isLoggedIn, SalesChannelController.apiCreate);
requestRouter.patch('/api/v1/sales-channel/:id/', Middlewares.isLoggedIn, SalesChannelController.apiUpdate);
requestRouter.delete('/api/v1/sales-channel/:id/', Middlewares.isLoggedIn, SalesChannelController.apiDelete);

requestRouter.get('/api/v1/sales-channel/create-default/', Middlewares.isLoggedIn, SalesChannelController.createDefault);
requestRouter.get('/api/v1/sales-channel/update-fleet/', Middlewares.isLoggedIn, SalesChannelController.updateFleet);

requestRouter.get('/api/v1/request-item-status/', Middlewares.isLoggedIn, RequestItemStatusController.apiList);
requestRouter.post('/api/v1/request-item-status/', Middlewares.isLoggedIn, RequestItemStatusController.apiCreate);
requestRouter.patch('/api/v1/request-item-status/:id/', Middlewares.isLoggedIn, RequestItemStatusController.apiUpdate);
requestRouter.delete('/api/v1/request-item-status/:id/', Middlewares.isLoggedIn, RequestItemStatusController.apiDelete);

export {
  requestRouter
};
