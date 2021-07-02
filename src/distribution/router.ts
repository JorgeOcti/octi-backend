import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import TransmittalController from './controllers/transmittal.controller';
import TransmittalItemController from './controllers/transmittalItem.controller';

const distributionRouter = express.Router();

// web pages
distributionRouter.get('/transmittals/', Middlewares.isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/:id/', Middlewares.isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/create/', Middlewares.isLoggedIn, TransmittalController.index);

// apis
distributionRouter.get('/api/v1/transmittals/', Middlewares.isLoggedIn, TransmittalController.apiList);
distributionRouter.post('/api/v1/transmittals/', Middlewares.isLoggedIn, TransmittalController.apiCreate);
distributionRouter.get('/api/v1/transmittals/:id/', Middlewares.isLoggedIn, TransmittalController.apiDetail);
distributionRouter.delete('/api/v1/transmittals/:id/', Middlewares.isLoggedIn, TransmittalController.apiDelete);

distributionRouter.get('/api/v1/transmittals/item/', Middlewares.isLoggedIn, TransmittalItemController.apiList);
distributionRouter.post('/api/v1/transmittals/item/', Middlewares.isLoggedIn, TransmittalItemController.apiCreate);
distributionRouter.get('/api/v1/transmittals/item/:id/', Middlewares.isLoggedIn, TransmittalItemController.apiDetail);
distributionRouter.delete('/api/v1/transmittals/item/:id/', Middlewares.isLoggedIn, TransmittalItemController.apiDelete);

export {
  distributionRouter
};
