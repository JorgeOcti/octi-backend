import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import InventoryController from './controllers/inventory.controller';
import LabelController from './controllers/label.controller';

const inventoryRouter = express.Router();

// Inventories List
inventoryRouter.get('/inventory/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/settings/labels/', Middlewares.isLoggedIn, LabelController.index);
inventoryRouter.get('/inventory/create/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/:id/', Middlewares.isLoggedIn, InventoryController.detail);
inventoryRouter.get('/inventory/:id/:tab/', Middlewares.isLoggedIn, InventoryController.detail);

// Inventories API Web
inventoryRouter.get('/api/inventory/', Middlewares.isLoggedIn, InventoryController.list);
inventoryRouter.post('/api/inventory/', Middlewares.isLoggedIn, InventoryController.create);
inventoryRouter.post('/api/inventory/:id/comment/', Middlewares.isJWTAuthenticated, InventoryController.addComment);
inventoryRouter.post('/api/inventory/:id/finish/', Middlewares.isLoggedIn, InventoryController.finishInventory);
inventoryRouter.post('/api/inventory/:id/set-label/', Middlewares.isLoggedIn, InventoryController.setLabel);
inventoryRouter.get('/api/inventory/:id/', Middlewares.isLoggedIn, InventoryController.detaill);
inventoryRouter.delete('/api/inventory/:id/', Middlewares.isLoggedIn, InventoryController.deleteInventory);

// Labels API Web
inventoryRouter.get('/api/admin/labels/', Middlewares.isLoggedIn, LabelController.apilist);
inventoryRouter.post('/api/admin/labels/', Middlewares.isLoggedIn, LabelController.apiCreateLabel);
inventoryRouter.put('/api/admin/labels/:id', Middlewares.isLoggedIn, LabelController.apiUpdateLabel);
inventoryRouter.delete('/api/admin/labels/:id', Middlewares.isLoggedIn, LabelController.apiDeleteLabel);

// Inventories API Mobile
inventoryRouter.get('/api/v1/inventory/', Middlewares.isJWTAuthenticated, InventoryController.apiList);
inventoryRouter.get('/api/v1/inventory/:id/', Middlewares.isJWTAuthenticated, InventoryController.apiDetail);
inventoryRouter.post('/api/v1/inventory/:id/upload-file/', Middlewares.isJWTAuthenticated, InventoryController.uploadFile);
inventoryRouter.post('/api/v1/inventory/:id/report-car/', Middlewares.isJWTAuthenticated, InventoryController.reportCar);
inventoryRouter.post('/api/v1/inventory/:id/', Middlewares.isJWTAuthenticated, InventoryController.apiFoundCar);


export {
  inventoryRouter
};
