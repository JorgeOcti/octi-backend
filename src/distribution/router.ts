import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import TransmittalController from './controllers/transmittal.controller';
import TransmittalItemController from './controllers/transmittalItem.controller';
import {createTransmittalSchema} from "./inputsSchema";

const distributionRouter = express.Router();

// web pages
distributionRouter.get('/transmittals/', Middlewares.isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/:id/', Middlewares.isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/create/', Middlewares.isLoggedIn, TransmittalController.index);

// apis
distributionRouter.get('/api/v1/transmittals/', Middlewares.isJWTAuthenticated, TransmittalController.apiList);
distributionRouter.post('/api/v1/transmittals/', Middlewares.isJWTAuthenticated, Middlewares.validateBody(createTransmittalSchema), TransmittalController.apiCreate);
distributionRouter.get('/api/v1/transmittals/only-me/', Middlewares.isJWTAuthenticated, TransmittalController.apiOnlyMe);
distributionRouter.get('/api/v1/transmittals/:id/', Middlewares.isJWTAuthenticated, TransmittalController.apiDetail);
distributionRouter.delete('/api/v1/transmittals/:id/', Middlewares.isJWTAuthenticated, TransmittalController.apiDelete);
distributionRouter.post('/api/v1/transmittals/upload-file/', Middlewares.isJWTAuthenticated, TransmittalController.uploadFile);

distributionRouter.get('/api/v1/transmittals/item/', Middlewares.isJWTAuthenticated, TransmittalItemController.apiList);
distributionRouter.post('/api/v1/transmittals/item/', Middlewares.isJWTAuthenticated, TransmittalItemController.apiCreate);
distributionRouter.get('/api/v1/transmittals/item/:id/', Middlewares.isJWTAuthenticated, TransmittalItemController.apiDetail);
distributionRouter.patch('/api/v1/transmittals/item/:id/', Middlewares.isJWTAuthenticated, TransmittalItemController.apiUpdate);
distributionRouter.delete('/api/v1/transmittals/item/:id/', Middlewares.isJWTAuthenticated, TransmittalItemController.apiDelete);

export {
  distributionRouter
};
