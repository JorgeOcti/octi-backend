"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const planning_controller_1 = require("./controllers/planning.controller");
const planningRouter = express.Router();
exports.planningRouter = planningRouter;
planningRouter.get('/planning/', middlewares_1.default.isLoggedIn, planning_controller_1.default.index);
planningRouter.get('/planning/import/', middlewares_1.default.isLoggedIn, planning_controller_1.default.index);
planningRouter.get('/api/admin/planning/', middlewares_1.default.isLoggedIn, planning_controller_1.default.list);
planningRouter.post('/api/admin/planning/', middlewares_1.default.isLoggedIn, planning_controller_1.default.create);
//# sourceMappingURL=router.js.map