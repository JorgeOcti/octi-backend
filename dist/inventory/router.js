"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const inventory_controller_1 = require("./controllers/inventory.controller");
const inventoryRouter = express.Router();
exports.inventoryRouter = inventoryRouter;
// Inventories List
inventoryRouter.get('/inventory/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.index);
inventoryRouter.get('/inventory/create/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.index);
inventoryRouter.get('/api/inventory/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.list);
inventoryRouter.post('/api/inventory/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.create);
inventoryRouter.post('/api/inventory/:id/finish/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.finishInventory);
inventoryRouter.delete('/api/inventory/:id/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.deleteInventory);
// Inventories API
inventoryRouter.get('/api/v1/inventory/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.apiList);
inventoryRouter.post('/api/v1/inventory/:id/upload-file/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.uploadFile);
inventoryRouter.post('/api/v1/inventory/:id/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.apiFoundCar);
//# sourceMappingURL=router.js.map