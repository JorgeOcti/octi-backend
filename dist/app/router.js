"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const app_controller_1 = require("./controllers/app.controller");
const adminUsers_controller_1 = require("./controllers/adminUsers.controller");
const jwt_controller_1 = require("./controllers/jwt.controller");
const middlewares_1 = require("../middlewares/middlewares");
const appRouter = express.Router();
exports.appRouter = appRouter;
// robots.txt
appRouter.get('/robots.txt', app_controller_1.default.robots);
// DashBoard Principal
appRouter.get('/', middlewares_1.default.isLoggedIn, app_controller_1.default.index);
appRouter.get('/2/', middlewares_1.default.isLoggedIn, app_controller_1.default.index);
// admin user
appRouter.get('/users/', middlewares_1.default.isLoggedIn, adminUsers_controller_1.default.users);
// api admin users
appRouter.get('/api/admin/users/', middlewares_1.default.isLoggedIn, adminUsers_controller_1.default.apiUsers);
appRouter.post('/api/admin/users/', middlewares_1.default.isLoggedIn, adminUsers_controller_1.default.apiAddUser);
appRouter.patch('/api/admin/users/:id/', middlewares_1.default.isLoggedIn, adminUsers_controller_1.default.apiEditUser);
appRouter.delete('/api/admin/users/:id/', middlewares_1.default.isLoggedIn, adminUsers_controller_1.default.apiDeleteUser);
// web login
appRouter.get('/account/login/', app_controller_1.default.login);
appRouter.post('/account/login/', app_controller_1.default.processLogin);
appRouter.get('/account/logout/', app_controller_1.default.logout);
const jwtRouter = express.Router();
exports.jwtRouter = jwtRouter;
// JWT login
jwtRouter.post('/login/', jwt_controller_1.default.login);
jwtRouter.post('/token/', jwt_controller_1.default.token);
jwtRouter.post('/test/', middlewares_1.default.isJWTAuthenticated, jwt_controller_1.default.test);
jwtRouter.post('/create/', jwt_controller_1.default.createUser);
//# sourceMappingURL=router.js.map