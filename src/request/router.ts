import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import ReasonController from './controllers/reason.controller';
import RequestController from './controllers/request.controller';
import RequestItemStatusController from './controllers/requestItemStatus.controller';

const requestRouter = express.Router();

// web pages
requestRouter.get('/requests/', Middlewares.isLoggedIn, RequestController.index);
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

requestRouter.get('/api/v1/request-item-status/', Middlewares.isLoggedIn, RequestItemStatusController.apiList);

export {
  requestRouter
};
