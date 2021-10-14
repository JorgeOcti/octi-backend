"use strict";
exports.__esModule = true;
exports.distributionRouter = void 0;
var express = require("express");
var middlewares_1 = require("../middlewares/middlewares");
var transmittal_controller_1 = require("./controllers/transmittal.controller");
var transmittalItem_controller_1 = require("./controllers/transmittalItem.controller");
var milestone_controller_1 = require("./controllers/milestone.controller");
var inputsSchema_1 = require("./inputsSchema");
var isJWTAuthenticated = middlewares_1["default"].isJWTAuthenticated, isLoggedIn = middlewares_1["default"].isLoggedIn, validateBody = middlewares_1["default"].validateBody;
var distributionRouter = express.Router();
exports.distributionRouter = distributionRouter;
// web pages
distributionRouter.get('/transmittals/', isLoggedIn, transmittal_controller_1["default"].index);
distributionRouter.get('/transmittals/export-xls/', isJWTAuthenticated, transmittal_controller_1["default"].xlsExport);
distributionRouter.get('/transmittals/create/', isLoggedIn, transmittal_controller_1["default"].index);
distributionRouter.get('/transmittals/:id/', isLoggedIn, transmittal_controller_1["default"].index);
distributionRouter.get('/transmittals/:id/download-files/', isLoggedIn, transmittal_controller_1["default"].downloadTransmittalFiles);
// apis
distributionRouter.get('/api/v1/transmittals/', isJWTAuthenticated, transmittal_controller_1["default"].apiList);
distributionRouter.post('/api/v1/transmittals/', isJWTAuthenticated, validateBody(inputsSchema_1.createTransmittalSchema), transmittal_controller_1["default"].apiCreate);
distributionRouter.get('/api/v1/transmittals/only-me/', isJWTAuthenticated, transmittal_controller_1["default"].apiOnlyMe);
distributionRouter.get('/api/v1/transmittals/:id/', isJWTAuthenticated, transmittal_controller_1["default"].apiDetail);
distributionRouter.patch('/api/v1/transmittals/:id/', isJWTAuthenticated, transmittal_controller_1["default"].apiPatch);
distributionRouter.put('/api/v1/transmittals/:id/', isJWTAuthenticated, transmittal_controller_1["default"].apiUpdate);
distributionRouter["delete"]('/api/v1/transmittals/:id/', isJWTAuthenticated, transmittal_controller_1["default"].apiDelete);
distributionRouter.post('/api/v1/transmittals/upload-file/', isJWTAuthenticated, transmittal_controller_1["default"].uploadFile);
distributionRouter.post('/api/v1/transmittals/attach-evidence/', isJWTAuthenticated, transmittal_controller_1["default"].attachEvidence);
distributionRouter.get('/api/v1/transmittals/item/', isJWTAuthenticated, transmittalItem_controller_1["default"].apiList);
distributionRouter.post('/api/v1/transmittals/item/', isJWTAuthenticated, transmittalItem_controller_1["default"].apiCreate);
distributionRouter.get('/api/v1/transmittals/item/:id/', isJWTAuthenticated, transmittalItem_controller_1["default"].apiDetail);
distributionRouter.patch('/api/v1/transmittals/item/:id/', isJWTAuthenticated, transmittalItem_controller_1["default"].apiUpdate);
distributionRouter["delete"]('/api/v1/transmittals/item/:id/', isJWTAuthenticated, transmittalItem_controller_1["default"].apiDelete);
distributionRouter.get('/api/v1/milestones/', isJWTAuthenticated, milestone_controller_1["default"].apiList);
//# sourceMappingURL=router.js.map