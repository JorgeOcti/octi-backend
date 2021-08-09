import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import TransmittalController from './controllers/transmittal.controller';
import TransmittalItemController from './controllers/transmittalItem.controller';
import {createTransmittalSchema} from "./inputsSchema";

const {isJWTAuthenticated, isLoggedIn, validateBody} = Middlewares;

const distributionRouter = express.Router();

// web pages
distributionRouter.get('/transmittals/', isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/:id/', isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/create/', isLoggedIn, TransmittalController.index);

// apis
distributionRouter.get('/api/v1/transmittals/', isJWTAuthenticated, TransmittalController.apiList);
distributionRouter.post('/api/v1/transmittals/', isJWTAuthenticated, validateBody(createTransmittalSchema), TransmittalController.apiCreate);
distributionRouter.get('/api/v1/transmittals/only-me/', isJWTAuthenticated, TransmittalController.apiOnlyMe);
distributionRouter.get('/api/v1/transmittals/:id/', isJWTAuthenticated, TransmittalController.apiDetail);
distributionRouter.patch('/api/v1/transmittals/:id/', isJWTAuthenticated, TransmittalController.apiUpdate);
distributionRouter.delete('/api/v1/transmittals/:id/', isJWTAuthenticated, TransmittalController.apiDelete);
distributionRouter.post('/api/v1/transmittals/upload-file/', isJWTAuthenticated, TransmittalController.uploadFile);
distributionRouter.post('/api/v1/transmittals/attach-evidence/', isJWTAuthenticated, TransmittalController.attachEvidence);

distributionRouter.get('/api/v1/transmittals/item/', isJWTAuthenticated, TransmittalItemController.apiList);
distributionRouter.post('/api/v1/transmittals/item/', isJWTAuthenticated, TransmittalItemController.apiCreate);
distributionRouter.get('/api/v1/transmittals/item/:id/', isJWTAuthenticated, TransmittalItemController.apiDetail);
distributionRouter.patch('/api/v1/transmittals/item/:id/', isJWTAuthenticated, TransmittalItemController.apiUpdate);
distributionRouter.delete('/api/v1/transmittals/item/:id/', isJWTAuthenticated, TransmittalItemController.apiDelete);

export {
  distributionRouter
};
