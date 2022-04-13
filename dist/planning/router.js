"use strict";
exports.__esModule = true;
exports.planningRouter = void 0;
var express = require("express");
var middlewares_1 = require("../middlewares/middlewares");
var planning_controller_1 = require("./controllers/planning.controller");
var planningRouter = express.Router();
exports.planningRouter = planningRouter;
planningRouter.get('/planning/', middlewares_1["default"].isLoggedIn, planning_controller_1["default"].index);
planningRouter.get('/planning/studio/', middlewares_1["default"].isLoggedIn, planning_controller_1["default"].index);
planningRouter.get('/planning/import/', middlewares_1["default"].isLoggedIn, planning_controller_1["default"].index);
planningRouter.get('/api/admin/planning/', middlewares_1["default"].isLoggedIn, planning_controller_1["default"].list);
planningRouter.post('/api/admin/planning/', middlewares_1["default"].isLoggedIn, planning_controller_1["default"].create);
//# sourceMappingURL=router.js.map