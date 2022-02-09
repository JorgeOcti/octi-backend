import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import ReasonController from './controllers/reason.controller';
import SalesChannelController from './controllers/salesChannel.controller';
import PaymentMethodController from './controllers/paymentMethod.controller';
import RequestController from './controllers/request.controller';
import RequestItemStatusController from './controllers/requestItemStatus.controller';
import OperationTypeController from './controllers/operationType.controller';

const requestRouter = express.Router();

// web pages
requestRouter.get('/requests/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/settings/reasons/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/settings/payment-methods/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/settings/channels/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/settings/status/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/settings/operations-type/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/export/', Middlewares.isLoggedIn, RequestController.exportExcel);
requestRouter.get('/requests/import/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/vehicles/external/create/', Middlewares.isLoggedIn, RequestController.integration);
requestRouter.post('/requests/vehicles/validate-conecta/', Middlewares.isLoggedIn, RequestController.validateContectaID);
requestRouter.get('/requests/vehicles/create/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/vehicles/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/vehicles/:id/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/create/', Middlewares.isLoggedIn, RequestController.index);
requestRouter.get('/requests/:id/', Middlewares.isLoggedIn, RequestController.index);

// apis
requestRouter.get('/api/v1/requests/search-car/', Middlewares.isJWTAuthenticated, RequestController.searhCar);
requestRouter.get('/api/v1/requests/search-vin', Middlewares.isLoggedIn, RequestController.searchVin);
requestRouter.post('/api/v1/requests/upload-file/', Middlewares.isJWTAuthenticated, RequestController.uploadFile);

requestRouter.post('/api/v1/requests/update-massive/', Middlewares.isJWTAuthenticated, RequestController.apiUpdateMassive);

requestRouter.get('/api/v1/requests/', Middlewares.isJWTAuthenticated, RequestController.apiList);
requestRouter.post('/api/v1/requests/import/', Middlewares.isJWTAuthenticated, RequestController.apiImport);
requestRouter.post('/api/v1/requests/', Middlewares.isJWTAuthenticated, RequestController.apiCreate);
requestRouter.get('/api/v1/requests/by-car/:id/', Middlewares.isJWTAuthenticated, RequestController.apiByVin);
requestRouter.get('/api/v1/requests/:id/', Middlewares.isJWTAuthenticated, RequestController.apiDetail);
requestRouter.delete('/api/v1/requests/:id/', Middlewares.isJWTAuthenticated, RequestController.apiDeleteRequest);

requestRouter.post('/api/v1/requests-item/', Middlewares.isJWTAuthenticated, RequestController.apiListItems);
requestRouter.post('/api/v1/add-requests-item/', Middlewares.isJWTAuthenticated, RequestController.apiCreateItem);
requestRouter.patch('/api/v1/requests-item/:id/', Middlewares.isJWTAuthenticated, RequestController.apiPatchItem);
requestRouter.delete('/api/v1/requests-item/:id/', Middlewares.isJWTAuthenticated, RequestController.apiDeleteRequestItem);

requestRouter.get('/requests-item/:id/download-files/', Middlewares.isJWTAuthenticated, RequestController.downloadItemFiles);

requestRouter.get('/api/v1/reasons/', Middlewares.isJWTAuthenticated, ReasonController.apiList);
requestRouter.post('/api/v1/reasons/', Middlewares.isJWTAuthenticated, ReasonController.apiCreate);
requestRouter.patch('/api/v1/reasons/:id/', Middlewares.isJWTAuthenticated, ReasonController.apiUpdate);
requestRouter.delete('/api/v1/reasons/:id/', Middlewares.isJWTAuthenticated, ReasonController.apiDelete);

requestRouter.get('/api/v1/sales-channel/', Middlewares.isJWTAuthenticated, SalesChannelController.apiList);
requestRouter.post('/api/v1/sales-channel/', Middlewares.isJWTAuthenticated, SalesChannelController.apiCreate);
requestRouter.patch('/api/v1/sales-channel/:id/', Middlewares.isJWTAuthenticated, SalesChannelController.apiUpdate);
requestRouter.delete('/api/v1/sales-channel/:id/', Middlewares.isJWTAuthenticated, SalesChannelController.apiDelete);

requestRouter.get('/api/v1/sales-channel/create-default/', Middlewares.isJWTAuthenticated, SalesChannelController.createDefault);
requestRouter.get('/api/v1/sales-channel/update-fleet/', Middlewares.isJWTAuthenticated, SalesChannelController.updateFleet);

requestRouter.get('/api/v1/payment-method/', Middlewares.isJWTAuthenticated, PaymentMethodController.apiList);
requestRouter.post('/api/v1/payment-method/', Middlewares.isJWTAuthenticated, PaymentMethodController.apiCreate);
requestRouter.patch('/api/v1/payment-method/:id/', Middlewares.isJWTAuthenticated, PaymentMethodController.apiUpdate);
requestRouter.delete('/api/v1/payment-method/:id/', Middlewares.isJWTAuthenticated, PaymentMethodController.apiDelete);

requestRouter.get('/api/v1/request-item-status/', Middlewares.isJWTAuthenticated, RequestItemStatusController.apiList);
requestRouter.post('/api/v1/request-item-status/', Middlewares.isJWTAuthenticated, RequestItemStatusController.apiCreate);
requestRouter.patch('/api/v1/request-item-status/:id/', Middlewares.isJWTAuthenticated, RequestItemStatusController.apiUpdate);
requestRouter.delete('/api/v1/request-item-status/:id/', Middlewares.isJWTAuthenticated, RequestItemStatusController.apiDelete);

requestRouter.get('/api/v1/operation-types/', Middlewares.isJWTAuthenticated, OperationTypeController.apiList);
requestRouter.post('/api/v1/operation-types/', Middlewares.isJWTAuthenticated, OperationTypeController.apiCreate);
requestRouter.patch('/api/v1/operation-types/:id/', Middlewares.isJWTAuthenticated, OperationTypeController.apiUpdate);
requestRouter.delete('/api/v1/operation-types/:id/', Middlewares.isJWTAuthenticated, OperationTypeController.apiDelete);

export {
  requestRouter
};
