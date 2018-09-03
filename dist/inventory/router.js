"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const inventory_controller_1 = require("./controllers/inventory.controller");
const inventoryRouter = express.Router();
exports.inventoryRouter = inventoryRouter;
// Inventories List
inventoryRouter.get('/inventory/', middlewares_1.default.isLoggedIn, inventory_controller_1.default.index);
//# sourceMappingURL=router.js.map