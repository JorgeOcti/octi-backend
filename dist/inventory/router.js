"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRouter = void 0;
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const inventory_controller_1 = require("./controllers/inventory.controller");
const label_controller_1 = require("./controllers/label.controller");
const inventoryRouter = express.Router();
exports.inventoryRouter = inventoryRouter;
// Inventories List
inventoryRouter.get('/inventory/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.index);
inventoryRouter.get('/inventory/dashboard/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.index);
inventoryRouter.get('/settings/labels/', middlewares_1.default.isLoggedIn, label_controller_1.default.index);
inventoryRouter.get('/inventory/create/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.index);
inventoryRouter.get('/inventory/excel/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.inventoryByCars);
inventoryRouter.get('/inventory/:id/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.detail);
inventoryRouter.get('/inventory/:id/:tab/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.detail);
// Inventories API Web
inventoryRouter.get('/api/inventory/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.list);
inventoryRouter.post('/api/inventory/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.create);
inventoryRouter.post('/api/external/inventory/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.test);
inventoryRouter.post('/api/inventory/dashboard/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.dashboard);
inventoryRouter.post('/api/inventory/:inventory/comment/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.addComment);
inventoryRouter.post('/api/inventory/:id/download-images/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.downloadImages);
inventoryRouter.post('/api/inventory/:id/finish/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.finishInventory);
inventoryRouter.post('/api/inventory/:id/set-label/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.setLabel);
inventoryRouter.get('/api/inventory/:id/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.detaill);
inventoryRouter.delete('/api/inventory/:id/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.deleteInventory);
// Labels API Web
inventoryRouter.get('/api/admin/labels/', middlewares_1.default.isLoggedIn, label_controller_1.default.apilist);
inventoryRouter.post('/api/admin/labels/', middlewares_1.default.isLoggedIn, label_controller_1.default.apiCreateLabel);
inventoryRouter.put('/api/admin/labels/:id', middlewares_1.default.isLoggedIn, label_controller_1.default.apiUpdateLabel);
inventoryRouter.delete('/api/admin/labels/:id', middlewares_1.default.isLoggedIn, label_controller_1.default.apiDeleteLabel);
// Inventories API Mobile
inventoryRouter.get('/api/v1/inventory/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.apiList);
inventoryRouter.get('/api/v1/inventory/:id/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.apiDetail);
inventoryRouter.post('/api/v1/inventory/:id/upload-file/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.uploadFile);
inventoryRouter.post('/api/v1/inventory/:id/report-car/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.reportCar);
inventoryRouter.post('/api/v1/inventory/:id/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.apiFoundCar);
// Stock
inventoryRouter.get('/stock/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.stock);
inventoryRouter.get('/stock/import/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.stock);
inventoryRouter.get('/api/current-stock/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.currentStock);
inventoryRouter.post('/api/load-stock/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.loadStock);
//# sourceMappingURL=router.js.map