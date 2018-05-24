"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const app_controller_1 = require("./controllers/app.controller");
const jwt_controller_1 = require("./controllers/jwt.controller");
const appRouter = express.Router();
exports.appRouter = appRouter;
appRouter.get('/', app_controller_1.default.index);
const jwtRouter = express.Router();
exports.jwtRouter = jwtRouter;
jwtRouter.post('/login/', jwt_controller_1.default.login);
jwtRouter.post('/test/', jwt_controller_1.default.isJWTAuthenticated, jwt_controller_1.default.test);
jwtRouter.post('/create/', jwt_controller_1.default.createUser);
//# sourceMappingURL=router.js.map