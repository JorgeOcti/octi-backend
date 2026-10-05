import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import TransmittalController from './controllers/transmittal.controller';
import TransmittalItemController from './controllers/transmittalItem.controller';
import MilestoneController from './controllers/milestone.controller';
import MilestoneTypeController from './controllers/milestoneType.controller';
import ShipmentController from './controllers/shipment.controller';
import { createTransmittalSchema } from './inputsSchema';

const {isJWTAuthenticated, isLoggedIn, validateBodyParams} = Middlewares;

const distributionRouter = express.Router();

// web pages
distributionRouter.get('/transmittals/', isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/export-xls/', isJWTAuthenticated, TransmittalController.xlsExport);
distributionRouter.get('/transmittals/create/', isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/:id/', isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/dashboard/', isLoggedIn, TransmittalController.index);
distributionRouter.get('/transmittals/:id/download-files/', isLoggedIn, TransmittalController.downloadTransmittalFiles);


// apis
distributionRouter.get('/api/v1/transmittals/', isJWTAuthenticated, TransmittalController.apiList);
distributionRouter.post('/api/v1/transmittals/', isJWTAuthenticated, validateBodyParams(createTransmittalSchema), TransmittalController.apiCreate);
distributionRouter.get('/api/v1/transmittals/only-me/', isJWTAuthenticated, TransmittalController.apiOnlyMe);
distributionRouter.get('/api/v1/transmittals/resume/', isJWTAuthenticated, TransmittalController.transmittalResume);
distributionRouter.get('/api/v1/transmittals/resume-by-status/', isJWTAuthenticated, TransmittalController.transmittalResumeByStatus);
distributionRouter.get('/api/v1/transmittals/:id/', isJWTAuthenticated, TransmittalController.apiDetail);
distributionRouter.patch('/api/v1/transmittals/:id/', isJWTAuthenticated, TransmittalController.apiPatch);
distributionRouter.put('/api/v1/transmittals/:id/', isJWTAuthenticated, TransmittalController.apiUpdate);
distributionRouter.get('/api/v1/transmittals/:id/mark-border/', isJWTAuthenticated, TransmittalController.apiRegisterBorderPass);
distributionRouter.delete('/api/v1/transmittals/:id/', isJWTAuthenticated, TransmittalController.apiDelete);
distributionRouter.post('/api/v1/transmittals/upload-file/', isJWTAuthenticated, TransmittalController.uploadFile);
distributionRouter.post('/api/v1/transmittals/attach-evidence/', isJWTAuthenticated, TransmittalController.attachEvidence);

distributionRouter.get('/api/v1/transmittals/item/', isJWTAuthenticated, TransmittalItemController.apiList);
distributionRouter.post('/api/v1/transmittals/item/', isJWTAuthenticated, TransmittalItemController.apiCreate);
distributionRouter.get('/api/v1/transmittals/item/:id/', isJWTAuthenticated, TransmittalItemController.apiDetail);
distributionRouter.patch('/api/v1/transmittals/item/:id/', isJWTAuthenticated, TransmittalItemController.apiUpdate);
distributionRouter.delete('/api/v1/transmittals/item/:id/', isJWTAuthenticated, TransmittalItemController.apiDelete);

distributionRouter.get('/api/v1/borders/', Middlewares.isJWTAuthenticated, TransmittalController.apiGetBorders);

distributionRouter.get('/transmittals/settings/milestone/', Middlewares.isLoggedIn, MilestoneController.index);
distributionRouter.get('/transmittals/settings/milestone-type/', Middlewares.isLoggedIn, MilestoneController.index);

distributionRouter.get('/api/v1/milestones/', isJWTAuthenticated, MilestoneController.apiList);
distributionRouter.patch('/api/v1/milestones/:id/', isJWTAuthenticated, MilestoneController.apiUpdate);

distributionRouter.get('/api/v1/milestone-types/', Middlewares.isJWTAuthenticated, MilestoneTypeController.apiList);
distributionRouter.post('/api/v1/milestone-types/', Middlewares.isJWTAuthenticated, MilestoneTypeController.apiCreate);
distributionRouter.patch('/api/v1/milestone-types/:id/', Middlewares.isJWTAuthenticated, MilestoneTypeController.apiUpdate);
distributionRouter.delete('/api/v1/milestone-types/:id/', Middlewares.isJWTAuthenticated, MilestoneTypeController.apiDelete);


// ---------------------------------------------------------------------------
// Envío de unidades
//
// Los pasos con contención (abrir patente, reclamar VIN, registrar salida) son
// online y chicos: la exclusión no se puede resolver en el dispositivo. El
// formulario de cada unidad y el de salida viajan por POST /api/v1/forms/:id
// con `shipmentItem` / `shipment` en el body, que ya es un camino con subida
// de fotos y reintentos. Ver docs/envio-de-unidades/.
// ---------------------------------------------------------------------------
distributionRouter.get('/api/v1/shipments/', isJWTAuthenticated, ShipmentController.apiListOpen);
distributionRouter.get('/api/v1/shipments/by-plate/:plate', isJWTAuthenticated, ShipmentController.apiOpenByPlate);
distributionRouter.post('/api/v1/shipments/', isJWTAuthenticated, ShipmentController.apiCreate);
distributionRouter.get('/api/v1/shipments/:id', isJWTAuthenticated, ShipmentController.apiDetail);
distributionRouter.post('/api/v1/shipments/:id/items', isJWTAuthenticated, ShipmentController.apiClaimUnit);
distributionRouter.delete('/api/v1/shipments/:id/items/:itemId', isJWTAuthenticated, ShipmentController.apiRemoveUnit);
distributionRouter.post('/api/v1/shipments/:id/depart', isJWTAuthenticated, ShipmentController.apiDepart);

//- Web (sesión). El scope lo resuelve el controlador: el handler ve lo que
//- despachó, el cliente ve lo suyo.
distributionRouter.get('/api/shipments/', isLoggedIn, ShipmentController.webList);
distributionRouter.get('/api/shipments/:id/items', isLoggedIn, ShipmentController.webItems);
distributionRouter.get('/api/shipments/:id/tarja.pdf', isLoggedIn, ShipmentController.webTarja);

export {
  distributionRouter
};
