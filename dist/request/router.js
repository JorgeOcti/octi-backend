"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRouter = void 0;
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const request_controller_1 = require("./controllers/request.controller");
const reason_controller_1 = require("./controllers/reason.controller");
const requestItemStatus_controller_1 = require("./controllers/requestItemStatus.controller");
const requestRouter = express.Router();
exports.requestRouter = requestRouter;
// web pages
requestRouter.get('/requests/', middlewares_1.default.isLoggedIn, request_controller_1.default.index);
requestRouter.get('/requests/:id/', middlewares_1.default.isLoggedIn, request_controller_1.default.index);
requestRouter.get('/requests/create/', middlewares_1.default.isLoggedIn, request_controller_1.default.index);
// apis
requestRouter.get('/api/v1/requests/search-car/', middlewares_1.default.isLoggedIn, request_controller_1.default.searhCar);
requestRouter.get('/api/v1/requests/', middlewares_1.default.isLoggedIn, request_controller_1.default.apiList);
requestRouter.post('/api/v1/requests/', middlewares_1.default.isLoggedIn, request_controller_1.default.apiCreate);
requestRouter.get('/api/v1/requests/:id/', middlewares_1.default.isLoggedIn, request_controller_1.default.apiDetail);
requestRouter.delete('/api/v1/requests/:id/', middlewares_1.default.isLoggedIn, request_controller_1.default.apiDeleteRequest);
requestRouter.post('/api/v1/requests-item/', middlewares_1.default.isLoggedIn, request_controller_1.default.apiCreateItem);
requestRouter.patch('/api/v1/requests-item/:id/', middlewares_1.default.isLoggedIn, request_controller_1.default.apiPatchItem);
requestRouter.delete('/api/v1/requests-item/:id/', middlewares_1.default.isLoggedIn, request_controller_1.default.apiDeleteRequestItem);
requestRouter.get('/api/v1/reasons/', middlewares_1.default.isLoggedIn, reason_controller_1.default.apiList);
requestRouter.get('/api/v1/request-item-status/', middlewares_1.default.isLoggedIn, requestItemStatus_controller_1.default.apiList);
//# sourceMappingURL=router.js.map