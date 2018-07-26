"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const csrf = require("csurf");
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const car_admin_controller_1 = require("./controllers/admin/car.admin.controller");
const companies_admin_controller_1 = require("./controllers/admin/companies.admin.controller");
const user_admin_controller_1 = require("./controllers/admin/user.admin.controller");
const venues_admin_controller_1 = require("./controllers/admin/venues.admin.controller");
const app_controller_1 = require("./controllers/app.controller");
const car_controller_1 = require("./controllers/car.controller");
const jwt_controller_1 = require("./controllers/jwt.controller");
const user_controller_1 = require("./controllers/user.controller");
// setup route middlewares
const appRouter = express.Router();
exports.appRouter = appRouter;
const csrfProtection = csrf({ cookie: true });
// robots.txt
appRouter.get('/robots.txt', app_controller_1.default.robots);
// DashBoard Principal
appRouter.get('/', middlewares_1.default.isLoggedIn, car_controller_1.default.generalDashboard);
// DashBoard Cars
appRouter.get('/cars/', middlewares_1.default.isLoggedIn, car_controller_1.default.vinDashboard);
appRouter.get('/cars/:id', middlewares_1.default.isLoggedIn, car_controller_1.default.vinDashboardDetail);
// api cars
appRouter.get('/api/admin/cars/:id', middlewares_1.default.isLoggedIn, car_controller_1.default.apiCarDetail);
appRouter.get('/api/admin/cars/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiCars);
// form detail
appRouter.get('/api/admin/participant/:id/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiParticipantDetail);
appRouter.get('/api/admin/participants-per-date/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiParticipantsPerDate);
// admin user
appRouter.get('/users/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.index);
// api admin users
appRouter.get('/api/admin/users/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.apiUsers);
appRouter.post('/api/admin/users/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.apiAddUser);
appRouter.patch('/api/admin/users/:id/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.apiEditUser);
appRouter.delete('/api/admin/users/:id/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.apiDeleteUser);
// import cars
appRouter.get('/import/cars/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.index);
appRouter.post('/api/admin/import-cars/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.importCars);
// admin companies
appRouter.get('/companies/', middlewares_1.default.isLoggedIn, companies_admin_controller_1.default.index);
// venue companies
appRouter.get('/venues/', middlewares_1.default.isLoggedIn, venues_admin_controller_1.default.index);
appRouter.get('/api/admin/venues/', middlewares_1.default.isLoggedIn, venues_admin_controller_1.default.apiVenues);
// validate vins
appRouter.post('/api/v1/check-vin/', middlewares_1.default.isJWTAuthenticated, car_controller_1.default.checkVIN);
// change password
appRouter.post('/api/v1/change-password/', middlewares_1.default.isJWTAuthenticated, user_controller_1.default.apiChangePassword);
// web login
appRouter.get('/account/login/', csrfProtection, app_controller_1.default.login);
appRouter.post('/account/login/', csrfProtection, app_controller_1.default.processLogin);
appRouter.get('/account/forgot-password/', csrfProtection, app_controller_1.default.forgotPassword);
appRouter.post('/account/forgot-password/', csrfProtection, app_controller_1.default.processForgotPassword);
appRouter.get('/account/recovery/:token', csrfProtection, app_controller_1.default.recovery);
appRouter.post('/account/recovery/:token', csrfProtection, app_controller_1.default.processRecovery);
appRouter.get('/account/logout/', app_controller_1.default.logout);
// JWT API
const jwtRouter = express.Router();
exports.jwtRouter = jwtRouter;
jwtRouter.post('/login/', jwt_controller_1.default.login);
jwtRouter.post('/token/', jwt_controller_1.default.token);
jwtRouter.post('/forgot-password/', jwt_controller_1.default.forgotPassword);
jwtRouter.post('/test/', middlewares_1.default.isJWTAuthenticated, jwt_controller_1.default.test);
//# sourceMappingURL=router.js.map