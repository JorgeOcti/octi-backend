"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const request_controller_1 = require("./controllers/request.controller");
const reason_controller_1 = require("./controllers/reason.controller");
const requestRouter = express.Router();
exports.requestRouter = requestRouter;
requestRouter.get('/requests/', middlewares_1.default.isLoggedIn, request_controller_1.default.index);
requestRouter.get('/requests/create/', middlewares_1.default.isLoggedIn, request_controller_1.default.index);
requestRouter.get('/api/v1/requests/search-car/', middlewares_1.default.isLoggedIn, request_controller_1.default.searhCar);
requestRouter.get('/api/v1/requests/', middlewares_1.default.isLoggedIn, request_controller_1.default.apiList);
requestRouter.post('/api/v1/requests/', middlewares_1.default.isLoggedIn, request_controller_1.default.apiCreate);
requestRouter.get('/api/v1/reasons/', middlewares_1.default.isLoggedIn, reason_controller_1.default.apiList);
//# sourceMappingURL=router.js.map