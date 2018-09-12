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
// Inventories API
inventoryRouter.get('/api/v1/inventory/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.apiList);
inventoryRouter.post('/api/v1/inventory/:id/', middlewares_1.default.isJWTAuthenticated, inventory_controller_1.default.apiFoundCar);
//# sourceMappingURL=router.js.map