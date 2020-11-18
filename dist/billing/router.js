"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingRouter = void 0;
const middlewares_1 = require("../middlewares/middlewares");
const billing_controller_1 = require("../billing/controllers/billing.controller");
const express = require("express");
const billingRouter = express.Router();
exports.billingRouter = billingRouter;
billingRouter.get('/settings/billing/pdf/:id', middlewares_1.default.isLoggedIn, billing_controller_1.default.pdf);
billingRouter.get('/settings/billing/', middlewares_1.default.isLoggedIn, billing_controller_1.default.index);
billingRouter.get('/settings/billing/run/', middlewares_1.default.isLoggedIn, billing_controller_1.default.run);
billingRouter.get('/api/admin/billing/', middlewares_1.default.isLoggedIn, billing_controller_1.default.apiList);
billingRouter.get('/api/admin/billing/detail/', middlewares_1.default.isLoggedIn, billing_controller_1.default.apiDetail);
//# sourceMappingURL=router.js.map