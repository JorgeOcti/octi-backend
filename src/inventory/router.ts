import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import InventoryController from './controllers/inventory.controller';
import LabelController from './controllers/label.controller';

const inventoryRouter = express.Router();

// Inventories List
inventoryRouter.get('/inventory/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/studio/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/dashboard/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/settings/labels/', Middlewares.isLoggedIn, LabelController.index);
inventoryRouter.get('/inventory/create/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/excel/', Middlewares.isLoggedIn, InventoryController.inventoryByCars);
inventoryRouter.get('/inventory/containers/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/desconsolidated/unit/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/management/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/management/:id/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/container/create/', Middlewares.isLoggedIn, InventoryController.index);
inventoryRouter.get('/inventory/:id/', Middlewares.isLoggedIn, InventoryController.detail);
inventoryRouter.get('/inventory/:id/:tab/', Middlewares.isLoggedIn, InventoryController.detail);


// Inventories API Web
inventoryRouter.get('/api/inventory/', Middlewares.isLoggedIn, InventoryController.list);
inventoryRouter.post('/api/inventory/', Middlewares.isLoggedIn, InventoryController.create);
inventoryRouter.post('/api/inventory/container/', Middlewares.isLoggedIn, InventoryController.createContainerInventory);
inventoryRouter.post('/api/external/inventory/', Middlewares.isJWTAuthenticated, InventoryController.test);
inventoryRouter.post('/api/inventory/dashboard/', Middlewares.isLoggedIn, InventoryController.dashboard);
inventoryRouter.post('/api/inventory/:inventory/comment/', Middlewares.isLoggedIn, InventoryController.addComment);
inventoryRouter.get('/api/inventory/:inventory/summary/', Middlewares.isJWTAuthenticated, InventoryController.summary);
inventoryRouter.post('/api/inventory/:id/download-images/', Middlewares.isJWTAuthenticated, InventoryController.downloadImages);
inventoryRouter.post('/api/inventory/:id/finish/', Middlewares.isLoggedIn, InventoryController.finishInventory);
inventoryRouter.post('/api/inventory/:id/set-label/', Middlewares.isLoggedIn, InventoryController.setLabel);
inventoryRouter.post('/api/inventory/:id/evidence/', Middlewares.isJWTAuthenticated, InventoryController.addStatusEvidence);
inventoryRouter.get('/api/summary/inventory/container/', Middlewares.isLoggedIn, InventoryController.containerInventorySummary);
inventoryRouter.get('/api/inventory/container/', Middlewares.isLoggedIn, InventoryController.containerInventoryDetail);
inventoryRouter.get('/api/inventory/:id/', Middlewares.isLoggedIn, InventoryController.detaill);
inventoryRouter.delete('/api/inventory/:id/', Middlewares.isLoggedIn, InventoryController.deleteInventory);
inventoryRouter.get('/api/inventory-car/files/:id/', Middlewares.isLoggedIn, InventoryController.listInventoryCarFiles);
inventoryRouter.delete('/api/inventory-car/files/:id/', Middlewares.isLoggedIn, InventoryController.removeInventoryCarFile);
inventoryRouter.get('/api/inventory/:inventoryId/container/tarja/:carId', InventoryController.pdf);

// Labels API Web
inventoryRouter.get('/api/admin/labels/', Middlewares.isLoggedIn, LabelController.apiList);
inventoryRouter.post('/api/admin/labels/', Middlewares.isLoggedIn, LabelController.apiCreateLabel);
inventoryRouter.put('/api/admin/labels/:id', Middlewares.isLoggedIn, LabelController.apiUpdateLabel);
inventoryRouter.delete('/api/admin/labels/:id', Middlewares.isLoggedIn, LabelController.apiDeleteLabel);

// Inventories API Mobile
inventoryRouter.get('/api/v1/inventory/', Middlewares.isJWTAuthenticated, InventoryController.apiList);
inventoryRouter.get('/api/v1/inventory/:id/', Middlewares.isJWTAuthenticated, InventoryController.apiDetail);
inventoryRouter.post('/api/v1/inventory/:id/upload-file/', Middlewares.isJWTAuthenticated, InventoryController.uploadFile);
inventoryRouter.post('/api/v1/inventory/:id/report-car/', Middlewares.isJWTAuthenticated, InventoryController.reportCar);
inventoryRouter.post('/api/v1/inventory/:id/', Middlewares.isJWTAuthenticated, InventoryController.apiFoundCar);

// Stock
inventoryRouter.get('/stock/', Middlewares.isLoggedIn, InventoryController.stock);
inventoryRouter.get('/stock/import/', Middlewares.isLoggedIn, InventoryController.stock);
inventoryRouter.get('/api/current-stock/', Middlewares.isLoggedIn, InventoryController.currentStock);
inventoryRouter.get('/api/osa-cars/', Middlewares.isLoggedIn, InventoryController.CarStatusList);
inventoryRouter.post('/api/load-stock/', Middlewares.isLoggedIn, InventoryController.loadStock);
inventoryRouter.get('/api/company/stock/:companyId', Middlewares.isJWTAuthenticated, InventoryController.currentCompanyStock);

export {
  inventoryRouter
};
