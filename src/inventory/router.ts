import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import InventoryController from './controllers/inventory.controller';

const inventoryRouter = express.Router();

// Inventories List
inventoryRouter.get('/inventory/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/create/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/:id/', Middlewares.isLoggedIn, InventoryController.detail);
inventoryRouter.get('/api/inventory/', Middlewares.isLoggedIn, InventoryController.list);
inventoryRouter.post('/api/inventory/', Middlewares.isLoggedIn, InventoryController.create);
inventoryRouter.get('/api/inventory/:id/', Middlewares.isLoggedIn, InventoryController.apiDetaill);
inventoryRouter.post('/api/inventory/:id/finish/', Middlewares.isLoggedIn, InventoryController.finishInventory);
inventoryRouter.delete('/api/inventory/:id/', Middlewares.isLoggedIn, InventoryController.deleteInventory);

// Inventories API
inventoryRouter.get('/api/v1/inventory/', Middlewares.isJWTAuthenticated, InventoryController.apiList);
inventoryRouter.post('/api/v1/inventory/:id/upload-file/', Middlewares.isJWTAuthenticated, InventoryController.uploadFile);
inventoryRouter.post('/api/v1/inventory/:id/report-car/', Middlewares.isJWTAuthenticated, InventoryController.reportCar);
inventoryRouter.post('/api/v1/inventory/:id/', Middlewares.isJWTAuthenticated, InventoryController.apiFoundCar);

export {
  inventoryRouter
};
