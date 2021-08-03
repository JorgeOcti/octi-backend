"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distributionRouter = void 0;
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const transmittal_controller_1 = require("./controllers/transmittal.controller");
const transmittalItem_controller_1 = require("./controllers/transmittalItem.controller");
const inputsSchema_1 = require("./inputsSchema");
const { isJWTAuthenticated, isLoggedIn, validateBody } = middlewares_1.default;
const distributionRouter = express.Router();
exports.distributionRouter = distributionRouter;
// web pages
distributionRouter.get('/transmittals/', isLoggedIn, transmittal_controller_1.default.index);
distributionRouter.get('/transmittals/:id/', isLoggedIn, transmittal_controller_1.default.index);
distributionRouter.get('/transmittals/create/', isLoggedIn, transmittal_controller_1.default.index);
// apis
distributionRouter.get('/api/v1/transmittals/', isJWTAuthenticated, transmittal_controller_1.default.apiList);
distributionRouter.post('/api/v1/transmittals/', isJWTAuthenticated, validateBody(inputsSchema_1.createTransmittalSchema), transmittal_controller_1.default.apiCreate);
distributionRouter.get('/api/v1/transmittals/only-me/', isJWTAuthenticated, transmittal_controller_1.default.apiOnlyMe);
distributionRouter.get('/api/v1/transmittals/:id/', isJWTAuthenticated, transmittal_controller_1.default.apiDetail);
distributionRouter.patch('/api/v1/transmittals/:id/', isJWTAuthenticated, transmittal_controller_1.default.apiUpdate);
distributionRouter.delete('/api/v1/transmittals/:id/', isJWTAuthenticated, transmittal_controller_1.default.apiDelete);
distributionRouter.post('/api/v1/transmittals/upload-file/', isJWTAuthenticated, transmittal_controller_1.default.uploadFile);
distributionRouter.get('/api/v1/transmittals/item/', isJWTAuthenticated, transmittalItem_controller_1.default.apiList);
distributionRouter.post('/api/v1/transmittals/item/', isJWTAuthenticated, transmittalItem_controller_1.default.apiCreate);
distributionRouter.get('/api/v1/transmittals/item/:id/', isJWTAuthenticated, transmittalItem_controller_1.default.apiDetail);
distributionRouter.patch('/api/v1/transmittals/item/:id/', isJWTAuthenticated, transmittalItem_controller_1.default.apiUpdate);
distributionRouter.delete('/api/v1/transmittals/item/:id/', isJWTAuthenticated, transmittalItem_controller_1.default.apiDelete);
//# sourceMappingURL=router.js.map